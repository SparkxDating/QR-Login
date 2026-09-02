import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
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
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

type AdminAuthRow = { password_hash: string; session_epoch: number };

function adminPassword(): string | null {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (fromEnv.length < MIN_PASSWORD_LENGTH) return null;
  return fromEnv;
}

function recoveryCode(): string | null {
  const fromEnv = process.env.ADMIN_RECOVERY_CODE?.trim() ?? "";
  if (fromEnv.length < MIN_PASSWORD_LENGTH) return null;
  return fromEnv;
}

function scryptKey(password: string, salt: Buffer, keylen: number, opts: { N: number; r: number; p: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(
      password,
      salt,
      keylen,
      { N: opts.N, r: opts.r, p: opts.p, maxmem: 64 * 1024 * 1024 },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      },
    );
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptKey(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    const dummy = await hashPassword(password).catch(() => "");
    void dummy;
    return false;
  }
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N < 2 || r < 1 || p < 1) {
    return false;
  }
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4] ?? "", "base64url");
    expected = Buffer.from(parts[5] ?? "", "base64url");
  } catch {
    return false;
  }
  if (salt.length < 8 || expected.length < 16) return false;
  const key = await scryptKey(password, salt, expected.length, { N, r, p });
  if (key.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(key, expected);
}

async function loadAdminAuth(): Promise<AdminAuthRow | null> {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql<AdminAuthRow>`
    select password_hash, session_epoch from admin_auth where id = 1
  `;
  const row = rows[0];
  if (!row?.password_hash) return null;
  return {
    password_hash: row.password_hash,
    session_epoch: Number(row.session_epoch) || 0,
  };
}

async function savePasswordHash(passwordHash: string): Promise<number> {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql<{ session_epoch: number }>`
    insert into admin_auth (id, password_hash, session_epoch, updated_at)
    values (1, ${passwordHash}, 1, now())
    on conflict (id) do update set
      password_hash = excluded.password_hash,
      session_epoch = admin_auth.session_epoch + 1,
      updated_at = now()
    returning session_epoch
  `;
  return Number(rows[0]?.session_epoch ?? 1);
}

async function currentSessionEpoch(): Promise<number> {
  const row = await loadAdminAuth();
  return row?.session_epoch ?? 0;
}

export async function adminAuthConfigured(): Promise<boolean> {
  if (adminPassword() !== null) return true;
  try {
    const row = await loadAdminAuth();
    return Boolean(row?.password_hash);
  } catch {
    return false;
  }
}

async function sessionSecret(): Promise<Uint8Array> {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  const password = adminPassword();
  let raw = explicit || (password ? `tsf-admin-session:v1:${password}` : "");
  if (!raw) {
    try {
      const row = await loadAdminAuth();
      if (row?.password_hash) raw = `tsf-admin-session:v2:${row.password_hash}`;
    } catch {
      raw = "";
    }
  }
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

function passwordStrength(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
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

export async function signAdminToken(epoch?: number): Promise<string> {
  const sessionEpoch = epoch ?? (await currentSessionEpoch());
  return new SignJWT({ role: "admin", epoch: sessionEpoch })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(await sessionSecret());
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, await sessionSecret());
    if (payload.role !== "admin") return false;
    const epoch = await currentSessionEpoch();
    const tokenEpoch = typeof payload.epoch === "number" ? payload.epoch : 0;
    return tokenEpoch === epoch;
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

async function verifyLoginPassword(password: string): Promise<"ok" | "unconfigured" | "invalid" | "unavailable"> {
  let stored: AdminAuthRow | null;
  try {
    stored = await loadAdminAuth();
  } catch {
    return "unavailable";
  }
  if (stored?.password_hash) {
    const ok = await verifyPasswordHash(password, stored.password_hash);
    return ok ? "ok" : "invalid";
  }
  const expected = adminPassword();
  if (!expected) {
    setResponseStatus(503);
    return "unconfigured";
  }
  return passwordsMatch(password, expected) ? "ok" : "invalid";
}

export async function loginWithPassword(
  password: string,
): Promise<"ok" | "unconfigured" | "invalid" | "unavailable"> {
  const result = await verifyLoginPassword(password);
  if (result !== "ok") return result;
  const token = await signAdminToken();
  setAdminCookie(token);
  return "ok";
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "invalid" | "weak" | "same" | "unavailable"> {
  if (!passwordStrength(newPassword)) return "weak";
  if (currentPassword === newPassword) return "same";
  const current = await verifyLoginPassword(currentPassword);
  if (current !== "ok") return current === "unconfigured" ? "invalid" : current;
  try {
    const epoch = await savePasswordHash(await hashPassword(newPassword));
    const token = await signAdminToken(epoch);
    setAdminCookie(token);
    return "ok";
  } catch {
    return "unavailable";
  }
}

export async function recoverAdminPassword(
  code: string,
  newPassword: string,
): Promise<"ok" | "invalid" | "weak" | "unavailable"> {
  const expected = recoveryCode();
  if (!expected || !passwordsMatch(code.trim(), expected)) return "invalid";
  if (!passwordStrength(newPassword)) return "weak";
  try {
    await savePasswordHash(await hashPassword(newPassword));
    clearAdminCookie();
    return "ok";
  } catch {
    return "unavailable";
  }
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
