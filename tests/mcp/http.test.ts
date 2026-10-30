// @vitest-environment node
import { spawn } from "node:child_process";
import { request } from "node:http";
import { existsSync } from "node:fs";
import { once } from "node:events";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startHttpServer } from "../../mcp/http";
import { calculate } from "../../src/tax/index";
import { DEFAULT_INPUTS } from "../../src/tax/defaults";
import { parseStrictTaxInputs } from "../../src/tax/strict";

let server: ReturnType<typeof startHttpServer>;
let url: string;
const clients: Client[] = [];
async function connect() {
  const client = new Client({ name: "http-test", version: "1" });
  clients.push(client);
  await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`)));
  return client;
}
beforeEach(async () => {
  server = startHttpServer({
    port: 0,
    host: "127.0.0.1",
    allowedOrigins: ["https://allowed.example"],
  });
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing server address");
  url = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  vi.restoreAllMocks();
});
describe("stateless HTTP MCP", () => {
  it("lists tools and publishes the registered capability contract", async () => {
    const client = await connect();
    const tools = (await client.listTools()).tools;
    const manifest = await (await fetch(`${url}/api/mcp/capabilities`)).json();
    expect(manifest).toEqual({
      contract_version: 1,
      enabled: true,
      mount_path: "/mcp",
      version: "0.1.0",
      tools: tools.map(({ name }) => ({
        name,
        effect: "read",
        requires_confirmation: false,
        access: {},
      })),
      resources: [],
      prompts: [],
    });
    expect(tools.map(({ name }) => name)).toEqual([
      "get_capabilities",
      "calculate_tax",
      "compare_scenarios",
    ]);
  });
  it("calculates engine parity, compares scenarios and returns tool validation errors", async () => {
    const client = await connect();
    const result = await client.callTool({ name: "calculate_tax", arguments: DEFAULT_INPUTS });
    expect((result.structuredContent as Record<string, unknown>)?.result).toEqual(
      calculate(parseStrictTaxInputs(DEFAULT_INPUTS)),
    );
    const comparison = await client.callTool({
      name: "compare_scenarios",
      arguments: { base: DEFAULT_INPUTS, overrides: { grossSalary: 70000 } },
    });
    expect(comparison.isError).not.toBe(true);
    expect((comparison.structuredContent as Record<string, unknown>)?.b).toEqual(
      calculate(parseStrictTaxInputs({ ...DEFAULT_INPUTS, grossSalary: 70000 })),
    );
    expect(
      (
        await client.callTool({
          name: "calculate_tax",
          arguments: { ...DEFAULT_INPUTS, grossSalary: -1 },
        })
      ).isError,
    ).toBe(true);
  });
  it("isolates concurrent requests", async () => {
    const [a, b] = await Promise.all([connect(), connect()]);
    const salaries = [61000, 92000];
    const results = await Promise.all(
      [a, b].map((client, i) =>
        client.callTool({
          name: "calculate_tax",
          arguments: { ...DEFAULT_INPUTS, grossSalary: salaries[i] },
        }),
      ),
    );
    results.forEach((result, i) =>
      expect((result.structuredContent as Record<string, unknown>)?.result).toEqual(
        calculate(parseStrictTaxInputs({ ...DEFAULT_INPUTS, grossSalary: salaries[i] })),
      ),
    );
  });
  it.each(["GET", "DELETE"])("rejects %s /mcp", async (method) => {
    const response = await fetch(`${url}/mcp`, { method });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });
  it.each(["/mcp/", "/mcp?x=1"])("routes %s like /mcp", async (path) => {
    const response = await fetch(`${url}${path}`, { method: "GET" });
    expect(response.status).toBe(405);
    const post = await fetch(`${url}${path}`, { method: "POST", body: "{" });
    expect(post.status).toBe(400);
  });
  it("serves health and rejects unknown routes", async () => {
    expect(await (await fetch(`${url}/healthz`)).json()).toEqual({ status: "ok" });
    expect((await fetch(`${url}/unknown`)).status).toBe(404);
  });
  it("bounds bodies and returns JSON-RPC parse errors", async () => {
    expect((await fetch(`${url}/mcp`, { method: "POST", body: "x".repeat(65537) })).status).toBe(
      413,
    );
    const response = await fetch(`${url}/mcp`, { method: "POST", body: "{" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
  });
  it("rejects a chunked body before the sender finishes the request", async () => {
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(`${url}/mcp`, { method: "POST" }, (response) => {
        response.resume();
        resolve(response.statusCode);
        req.end();
      });
      req.on("error", reject);
      req.write("x".repeat(32768));
      req.write("x".repeat(32769));
      // Intentionally do not end: the streaming limit must respond immediately.
    });
    expect(status).toBe(413);
  });
  it("rejects Origin headers with an empty allow-list", async () => {
    const locked = startHttpServer({ port: 0, host: "127.0.0.1", allowedOrigins: [] });
    try {
      await once(locked, "listening");
      const address = locked.address();
      if (!address || typeof address === "string") throw new Error("Missing address");
      const base = `http://127.0.0.1:${address.port}`;
      expect(
        (await fetch(`${base}/healthz`, { headers: { Origin: "https://allowed.example" } })).status,
      ).toBe(403);
      expect((await fetch(`${base}/healthz`)).status).toBe(200);
    } finally {
      locked.closeAllConnections();
      await new Promise<void>((resolve) => locked.close(() => resolve()));
    }
  });
  it("validates origins and leaves content negotiation to the SDK", async () => {
    expect(
      (await fetch(`${url}/healthz`, { headers: { Origin: "https://bad.example" } })).status,
    ).toBe(403);
    expect(
      (await fetch(`${url}/healthz`, { headers: { Origin: "https://allowed.example" } })).status,
    ).toBe(200);
    const request = {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    };
    expect((await fetch(`${url}/mcp`, request)).status).toBe(406);
    expect(
      (
        await fetch(`${url}/mcp`, {
          ...request,
          headers: { Accept: "application/json, text/event-stream" },
        })
      ).status,
    ).toBe(415);
  });
  it("logs no request inputs or results", async () => {
    const spies = [
      vi.spyOn(console, "log"),
      vi.spyOn(console, "error"),
      vi.spyOn(console, "warn"),
      vi.spyOn(process.stdout, "write"),
      vi.spyOn(process.stderr, "write"),
    ];
    const client = await connect();
    await client.callTool({
      name: "calculate_tax",
      arguments: { ...DEFAULT_INPUTS, grossSalary: 81234.56 },
    });
    await fetch(`${url}/mcp`, { method: "POST", body: "private-invalid-body" });
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

it.skipIf(!existsSync("dist-mcp/http.mjs"))(
  "runs the HTTP bundle without starting stdio",
  async () => {
    const child = spawn(process.execPath, ["dist-mcp/http.mjs"], {
      env: { ...process.env, PORT: "0", HOST: "127.0.0.1" },
      stdio: "pipe",
    });
    let output = "";
    let errors = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      errors += String(chunk);
    });
    const exited = once(child, "exit");
    try {
      const [line] = await once(child.stdout, "data");
      const port = String(line).match(/port (\d+)/)?.[1];
      expect(port).toBeDefined();
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 99, method: "tools/list" }) + "\n");
      const client = new Client({ name: "bundle-test", version: "1" });
      try {
        await client.connect(
          new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)),
        );
        expect((await client.listTools()).tools).toHaveLength(3);
      } finally {
        await client.close();
      }
    } finally {
      child.kill("SIGTERM");
      await exited;
    }
    expect(output).toMatch(/^Bordertax MCP HTTP server listening on port \d+\n$/);
    expect(errors).toBe("");
  },
);
