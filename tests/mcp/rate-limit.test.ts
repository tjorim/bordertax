// @vitest-environment node
import { describe, expect, it } from "vitest";
import { clientKey, RequestRateLimiter } from "../../mcp/rate-limit";

describe("MCP request limits", () => {
  it("bounds requests, separates clients and expires windows", () => {
    let now = 1_000_000;
    const limiter = new RequestRateLimiter(2, 60_000, 2, () => now);
    expect(limiter.take("a").headers["X-RateLimit-Remaining"]).toBe("1");
    expect(limiter.take("a").allowed).toBe(true);
    expect(limiter.take("a")).toMatchObject({
      allowed: false,
      headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
    });
    expect(limiter.take("b").allowed).toBe(true);
    // Capacity fails closed and cannot evict a's exhausted active window.
    expect(limiter.take("c").allowed).toBe(false);
    expect(limiter.take("a").allowed).toBe(false);
    now += 60_001;
    expect(limiter.take("c").allowed).toBe(true);
    expect(limiter.take("a").allowed).toBe(true);
  });
  it("validates configuration", () => {
    for (const value of [0, -1, Number.NaN, 1.5])
      expect(() => new RequestRateLimiter(value)).toThrow("positive integers");
  });
  it("trusts validated proxy headers only from a private immediate peer", () => {
    expect(clientKey("8.8.8.8", "1.1.1.1")).toBe("8.8.8.8");
    expect(clientKey("10.0.0.1", "1.1.1.1")).toBe("1.1.1.1");
    expect(clientKey("10.0.0.1", "invalid")).toBe("10.0.0.1");
    expect(clientKey("10.0.0.1", "1.1.1.1, 2.2.2.2")).toBe("10.0.0.1");
    expect(clientKey("::ffff:127.0.0.1", "::ffff:1.1.1.1")).toBe("1.1.1.1");
    expect(clientKey(undefined, "1.1.1.1")).toBe("unknown");
  });
  it("groups IPv6 subscribers and mapped IPv4 consistently", () => {
    expect(clientKey("2001:db8:1:2::1", undefined)).toBe(
      clientKey("2001:db8:1:2::ffff", undefined),
    );
    expect(clientKey("::ffff:8.8.8.8", undefined)).toBe("8.8.8.8");
    expect(clientKey("::1", "2001:db8:1:3::1")).not.toBe(clientKey("::1", "2001:db8:1:2::1"));
  });
});
