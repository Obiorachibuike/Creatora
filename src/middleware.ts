import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security: per-IP rate limits (Part 13). The in-memory map is a dev
 * convenience; production uses Redis or pg-boss-backed counters.
 */
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/sign-in": { limit: 10, windowMs: 15 * 60_000 },
  "/api/auth/sign-up": { limit: 5, windowMs: 15 * 60_000 },
  "/api/generations": { limit: 20, windowMs: 60_000 },
  "/api/exports": { limit: 5, windowMs: 60_000 },
  "/api/director": { limit: 10, windowMs: 60_000 },
};

const buckets = new Map<string, number[]>();

function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const times = buckets.get(key) ?? [];
  const fresh = times.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) return false;
  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const conf = RATE_LIMITS[path];
  if (conf) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";
    if (!hit(`${path}:${ip}`, conf.limit, conf.windowMs)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/generations", "/api/exports", "/api/director"],
};
