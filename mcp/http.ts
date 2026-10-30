import { createServer as createHttpServer, type ServerResponse } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server";

const bodyLimit = 64 * 1024;
function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
async function capabilities() {
  const server = createServer();
  const client = new Client({ name: "manifest", version: "1" });
  const [local, remote] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(remote);
    await client.connect(local);
    const { tools } = await client.listTools();
    return {
      contract_version: 1,
      enabled: true,
      mount_path: "/mcp",
      version: client.getServerVersion()!.version,
      tools: tools.map((tool) => ({
        name: tool.name,
        effect: tool.annotations?.readOnlyHint === true ? "read" : "write",
        requires_confirmation: tool.annotations?.readOnlyHint !== true,
        access: {},
      })),
      resources: [],
      prompts: [],
    };
  } finally {
    await client.close();
    await server.close();
  }
}

export function startHttpServer({
  port = Number(process.env.PORT ?? 8080),
  host = process.env.HOST ?? "0.0.0.0",
  allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
}: { port?: number; host?: string; allowedOrigins?: string[] } = {}) {
  const server = createHttpServer(
    { headersTimeout: 10_000, requestTimeout: 30_000 },
    async (req, res) => {
      try {
        if (req.headers.origin !== undefined && !allowedOrigins.includes(req.headers.origin)) {
          json(res, 403, { error: "Origin not allowed" });
          return;
        }
        if (req.method === "GET" && req.url === "/healthz") {
          json(res, 200, { status: "ok" });
          return;
        }
        if (req.method === "GET" && req.url === "/api/mcp/capabilities") {
          json(res, 200, await capabilities());
          return;
        }
        if (req.url !== "/mcp") {
          json(res, 404, { error: "Not found" });
          return;
        }
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          json(res, 405, { error: "Method not allowed" });
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        // Stop retaining data as soon as the streaming limit is exceeded.
        for await (const chunk of req) {
          size += chunk.length;
          if (size > bodyLimit) {
            res.setHeader("Connection", "close");
            json(res, 413, { error: "Request body too large" });
            return;
          }
          chunks.push(chunk);
        }
        let body: unknown;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          json(res, 400, {
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          });
          return;
        }
        const mcp = createServer();
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        res.once("close", () => {
          void Promise.allSettled([transport.close(), mcp.close()]);
        });
        await mcp.connect(transport);
        await transport.handleRequest(req, res, body);
      } catch {
        // Never log exceptions: SDK errors may contain user-supplied values.
        if (!res.headersSent) json(res, 500, { error: "Internal server error" });
        else res.end();
      }
    },
  );
  server.setTimeout(30_000, (socket) => socket.destroy());
  server.listen(port, host);
  return server;
}

if (import.meta.main) {
  const server = startHttpServer();
  server.once("listening", () => {
    const address = server.address();
    console.log(
      `Bordertax MCP HTTP server listening on port ${typeof address === "object" ? address?.port : "unknown"}`,
    );
  });
  server.on("error", () => {
    console.error("MCP HTTP server failed");
    process.exitCode = 1;
  });
  const shutdown = () => {
    server.close();
    const deadline = setTimeout(() => server.closeAllConnections(), 5000);
    deadline.unref();
    server.once("close", () => clearTimeout(deadline));
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
