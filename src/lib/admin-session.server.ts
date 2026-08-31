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
const MIN_PASSWORD_LENGTH = 8;

function adminPassword(): string | null {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (fromEnv.length < MIN_PASSWORD_LENGTH) return null;
  return fromEnv;
}

export function adminAuthConfigured(): boolean {
  return adminPassword() !== null;
}

function sessionSecret(): Uint8Array {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  const password = adminPassword();
  const raw = explicit || (password ? `tsf-admin-session:v1:${password}` : "");
  if (!raw) {
    return createHash("sha256").update("tsf-admin-unconfigured").digest();
  }
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
    throw new Error("अमान्य अनुरोध");
  }
  const origin = getRequestHeader("origin");
  if (!origin) return;
  const url = getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  try {
    if (new URL(origin).host !== url.host) {
      setResponseStatus(403);
      throw new Error("अमान्य अनुरोध");
    }
  } catch {
    setResponseStatus(403);
    throw new Error("अमान्य अनुरोध");
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
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure,
  });
}

export function clearAdminCookie(): void {
  deleteCookie(ADMIN_COOKIE, { path: "/" });
}

export async function loginWithPassword(
  password: string,
): Promise<"ok" | "unconfigured" | "invalid"> {
  const expected = adminPassword();
  if (!expected) {
    setResponseStatus(503);
    return "unconfigured";
  }
  if (!passwordsMatch(password, expected)) return "invalid";
  const token = await signAdminToken();
  setAdminCookie(token);
  return "ok";
}

export function readAdminCookie(): string | undefined {
  return getCookie(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<void> {
  setResponseHeader("cache-control", "no-store");
  setResponseHeader("vary", "Cookie");
  const cookie = getCookie(ADMIN_COOKIE);
  const ok = await verifyAdminToken(cookie);
  if (!ok) {
    setResponseStatus(401);
    throw new Error("प्रशासन लॉगिन आवश्यक है");
  }
}

export function requestUrl(): URL {
  try {
    return getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  } catch {
    return new URL(getRequest().url);
  }
}
