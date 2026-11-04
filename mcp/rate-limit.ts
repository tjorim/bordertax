import { BlockList, isIP } from "node:net";

const privatePeers = new BlockList();
for (const [address, prefix] of [
  ["10.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["127.0.0.0", 8],
] as const)
  privatePeers.addSubnet(address, prefix, "ipv4");
privatePeers.addAddress("::1", "ipv6");
privatePeers.addSubnet("fc00::", 7, "ipv6");

function address(value: string, aggregate = false): string | undefined {
  const family = isIP(value);
  if (family === 4) return value;
  if (family !== 6 || value.includes("%")) return undefined;
  const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const [left, right] = canonical.split("::");
  const head = left ? left.split(":") : [];
  const tail = right ? right.split(":") : [];
  const parts = (
    right === undefined
      ? head
      : [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail]
  ).map((part) => Number.parseInt(part, 16));
  if (parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff)
    return [parts[6]! >> 8, parts[6]! & 255, parts[7]! >> 8, parts[7]! & 255].join(".");
  return aggregate
    ? `${parts
        .slice(0, 4)
        .map((part) => part.toString(16))
        .join(":")}::`
    : canonical;
}

/** Caddy is the private immediate peer; public callers cannot choose a bucket. */
export function clientKey(peer: string | undefined, forwarded: string | undefined): string {
  const actual = address(peer ?? "");
  if (!actual) return "unknown";
  const family = isIP(actual) === 4 ? "ipv4" : "ipv6";
  if (privatePeers.check(actual, family)) {
    const real = address(forwarded?.trim() ?? "", true);
    if (real) return real;
  }
  return address(actual, true)!;
}

/** Fixed windows, bounded process-local storage; never evict an active client. */
export class RequestRateLimiter {
  private readonly clients = new Map<string, { count: number; expires: number }>();
  private lastSweep = 0;
  readonly limit: number;
  readonly windowMs: number;
  readonly maxClients: number;
  private readonly now: () => number;
  constructor(limit = 60, windowMs = 60_000, maxClients = 10_000, now: () => number = Date.now) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxClients = maxClients;
    this.now = now;
    if (![limit, windowMs, maxClients].every((value) => Number.isSafeInteger(value) && value > 0))
      throw new Error("Rate-limit settings must be positive integers");
  }
  take(key: string) {
    const now = this.now();
    if (now - this.lastSweep >= 1000 || now < this.lastSweep) {
      for (const [client, window] of this.clients)
        if (window.expires <= now) this.clients.delete(client);
      this.lastSweep = now;
    }
    let window = this.clients.get(key);
    if (window && window.expires <= now) {
      this.clients.delete(key);
      window = undefined;
    }
    if (!window && this.clients.size < this.maxClients) {
      window = { count: 0, expires: now + this.windowMs };
      this.clients.set(key, window);
    }
    const allowed = window !== undefined && window.count < this.limit;
    // Saturate rather than let abusive traffic grow the counter indefinitely.
    if (window && allowed) window.count++;
    const reset = window?.expires ?? now + this.windowMs;
    return {
      allowed,
      headers: {
        "X-RateLimit-Limit": String(this.limit),
        "X-RateLimit-Remaining": String(window ? Math.max(0, this.limit - window.count) : 0),
        "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
        "Retry-After": String(Math.max(1, Math.ceil((reset - now) / 1000))),
      },
    };
  }
}
