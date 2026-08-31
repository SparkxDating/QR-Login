import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  deleteCookie,
  getCookie,
  getRequest,
  getRequestHeader,
  getRequestIP,
  getRequestProtocol,
  getRequestUrl,
  setCookie,
  setResponseHeader,
  setResponseStatus,
} from "@tanstack/react-start/server";

export const ADMIN_COOKIE = "tsf_admin";
const TOKEN_TTL = "12h";
const DEFAULT_PASSWORD = "Trishakti@2026";

function adminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_PASSWORD;
}

export function usingPreviewAdminPassword(): boolean {
  return !process.env.ADMIN_PASSWORD && !process.env.DATABASE_URL;
}

function sessionSecret(): Uint8Array {
  const raw =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    `tsf-admin-session:v1:${adminPassword()}`;
  return createHash("sha256").update(raw).digest();
}

function passwordsMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function assertSameOriginWrite(): void {
  const site = getRequestHeader("sec-fetch-site");
  if (site === "cross-site") {
    setResponseStatus(403);
    throw new Error("\u0905\u092e\u093e\u0928\u094d\u092f \u0905\u0928\u0941\u0930\u094b\u0927");
  }
  const origin = getRequestHeader("origin");
  if (!origin) return;
  const url = getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  try {
    if (new URL(origin).host !== url.host) {
      setResponseStatus(403);
      throw new Error("\u0905\u092e\u093e\u0928\u094d\u092f \u0905\u0928\u0941\u0930\u094b\u0927");
    }
  } catch {
    setResponseStatus(403);
    throw new Error("\u0905\u092e\u093e\u0928\u094d\u092f \u0905\u0928\u0941\u0930\u094b\u0927");
  }
}

export function clientKey(kind: string): string {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  return `${kind}:${ip}`;
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(sessionSecret());
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function setAdminCookie(token: string): void {
  const secure = getRequestProtocol({ xForwardedProto: true }) === "https";
  setCookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure,
  });
}

export function clearAdminCookie(): void {
  deleteCookie(ADMIN_COOKIE, { path: "/" });
}

export async function loginWithPassword(password: string): Promise<string | null> {
  if (!passwordsMatch(password, adminPassword())) return null;
  const token = await signAdminToken();
  setAdminCookie(token);
  return token;
}

export function readAdminCookie(): string | undefined {
  return getCookie(ADMIN_COOKIE);
}

export async function requireAdmin(presentedToken?: string): Promise<void> {
  setResponseHeader("cache-control", "no-store");
  setResponseHeader("vary", "Cookie");
  const cookie = getCookie(ADMIN_COOKIE);
  const ok = (await verifyAdminToken(cookie)) || (await verifyAdminToken(presentedToken));
  if (!ok) {
    setResponseStatus(401);
    throw new Error("\u092a\u094d\u0930\u0936\u093e\u0938\u0928 \u0932\u0949\u0917\u093f\u0928 \u0906\u0935\u0936\u094d\u092f\u0915 \u0939\u0948");
  }
}


export function requestUrl(): URL {
  try {
    return getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  } catch {
    return new URL(getRequest().url);
  }
}
