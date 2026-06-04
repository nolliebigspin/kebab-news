import { describe, expect, it } from "vitest";

import { extractClientIp, hashIp, todayBucket } from "../apps/web/lib/vote";

describe("extractClientIp", () => {
  it("uses the leftmost entry of x-forwarded-for", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" },
    });
    expect(extractClientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-real-ip": "198.51.100.5" },
    });
    expect(extractClientIp(req)).toBe("198.51.100.5");
  });

  it("returns 'unknown' when no headers are set", () => {
    const req = new Request("http://localhost/");
    expect(extractClientIp(req)).toBe("unknown");
  });

  it("ignores empty x-forwarded-for values", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "", "x-real-ip": "198.51.100.5" },
    });
    expect(extractClientIp(req)).toBe("198.51.100.5");
  });
});

describe("hashIp", () => {
  it("produces the same hash for the same (ip, salt) pair", () => {
    expect(hashIp("198.51.100.5", "salt-A")).toBe(hashIp("198.51.100.5", "salt-A"));
  });

  it("produces a different hash when the salt changes", () => {
    expect(hashIp("198.51.100.5", "salt-A")).not.toBe(hashIp("198.51.100.5", "salt-B"));
  });

  it("produces a different hash when the IP changes", () => {
    expect(hashIp("198.51.100.5", "salt-A")).not.toBe(hashIp("198.51.100.6", "salt-A"));
  });

  it("returns a 64-char hex string (sha256)", () => {
    const h = hashIp("198.51.100.5", "salt-A");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("includes a separator so 'ip|x' + salt 'y' differs from 'ip' + salt 'xy'", () => {
    // Belt-and-suspenders: regression guard against a future refactor that
    // drops the "|" separator between ip and salt and turns hashIp into
    // sha256(ip + salt). With the separator in place, these must differ.
    expect(hashIp("ip", "Xsalt")).not.toBe(hashIp("ipX", "salt"));
  });
});

describe("todayBucket", () => {
  it("formats a known UTC date as YYYY-MM-DD", () => {
    expect(todayBucket(new Date("2026-05-20T15:30:00Z"))).toBe("2026-05-20");
  });

  it("uses UTC, not local time", () => {
    // 2026-01-01T00:30:00Z is still 2025-12-31 in west-of-UTC timezones,
    // but todayBucket must always say 2026-01-01.
    expect(todayBucket(new Date("2026-01-01T00:30:00Z"))).toBe("2026-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(todayBucket(new Date("2026-03-05T12:00:00Z"))).toBe("2026-03-05");
  });
});
