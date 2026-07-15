import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { getCurrentUser } from "./auth";
import { rateLimit } from "./rate-limit";
import type { Role, User } from "@prisma/client";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Parse & validate a JSON body, returning a typed value or throwing 422. */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
  try {
    return schema.parse(json);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new ApiError(e.issues[0]?.message ?? "Validation failed", 422, {
        issues: e.issues,
      });
    }
    throw e;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export function limitOrThrow(
  req: Request,
  name: string,
  cfg: { limit: number; windowSec: number },
) {
  const res = rateLimit(`${name}:${clientIp(req)}`, cfg);
  if (!res.ok) {
    throw new ApiError(
      "Too many requests. Please slow down and try again shortly.",
      429,
      { retryAfterSec: res.retryAfterSec },
    );
  }
}

export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("You must be signed in.", 401);
  return user;
}

export async function requireApiRole(...roles: Role[]): Promise<User> {
  const user = await requireApiUser();
  if (!roles.includes(user.role))
    throw new ApiError("You don't have access to this resource.", 403);
  return user;
}

/** Wrap a route handler so thrown ApiError/Zod become clean JSON responses. */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.message, e.status, e.extra);
      // eslint-disable-next-line no-console
      console.error("[api] unhandled", e);
      return fail("Something went wrong.", 500);
    }
  };
}

/** Like `handler` but for dynamic routes that receive a params context. */
export function route<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.message, e.status, e.extra);
      // eslint-disable-next-line no-console
      console.error("[api] unhandled", e);
      return fail("Something went wrong.", 500);
    }
  };
}

type IdCtx = { params: Promise<{ id: string }> };
export type { IdCtx };
