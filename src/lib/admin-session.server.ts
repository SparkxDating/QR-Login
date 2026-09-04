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
import { isAdminRole, type AdminRole } from "./admin";

export const ADMIN_COOKIE = "tsf_admin";
const TOKEN_TTL = "12h";
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

export type AdminSession = { role: AdminRole; epoch: number };

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

function superAdminUsername(): string | null {
  const fromEnv = process.env.SUPER_ADMIN_USERNAME?.trim() ?? "";
  return fromEnv.length > 0 ? fromEnv : null;
}

function superAdminPassword(): string | null {
  const fromEnv = process.env.SUPER_ADMIN_PASSWORD?.trim() ?? "";
  if (fromEnv.length < MIN_PASSWORD_LENGTH) return null;
  return fromEnv;
}

export function superAdminConfigured(): boolean {
  return superAdminUsername() !== null && superAdminPassword() !== null;
}

function superAdminStamp(): string {
  const username = superAdminUsername() ?? "";
  const password = superAdminPassword() ?? "";
  return createHash("sha256").update(`sa:${username}:${password}`).digest("base64url").slice(0, 22);
}

function secretsMatch(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
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
  if (!row) return null;
  return {
    password_hash: row.password_hash ?? "",
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
  if (superAdminConfigured()) return true;
  try {
    const row = await loadAdminAuth();
    return Boolean(row?.password_hash?.startsWith("scrypt$"));
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

export async function writeAudit(actorRole: string, action: string, detail = ""): Promise<void> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const ip = getRequestIP({ xForwardedFor: true }) ?? "";
    const safeRole = actorRole.slice(0, 40);
    const safeAction = action.slice(0, 80);
    const safeDetail = detail.slice(0, 200);
    const safeIp = ip.slice(0, 80);
    await sql`
      insert into admin_audit_log (actor_role, action, detail, ip)
      values (${safeRole}, ${safeAction}, ${safeDetail}, ${safeIp})
    `;
  } catch {
    // Audit must never block the primary action.
  }
}

export async function signAdminToken(epochOrRole?: number | { epoch?: number; role?: AdminRole }): Promise<string> {
  const opts = typeof epochOrRole === "number" || epochOrRole === undefined
    ? { epoch: epochOrRole, role: "admin" as const }
    : epochOrRole;
  const role = opts.role ?? "admin";
  const sessionEpoch = role === "admin" ? (opts.epoch ?? (await currentSessionEpoch())) : 0;
  const payload: Record<string, unknown> = { role, epoch: sessionEpoch };
  if (role === "super_admin") payload.stamp = superAdminStamp();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(await sessionSecret());
}

export async function readAdminSession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await sessionSecret());
    if (!isAdminRole(payload.role)) return null;
    if (payload.role === "super_admin") {
      if (!superAdminConfigured()) return null;
      if (payload.stamp !== superAdminStamp()) return null;
      return { role: "super_admin", epoch: 0 };
    }
    const epoch = await currentSessionEpoch();
    const tokenEpoch = typeof payload.epoch === "number" ? payload.epoch : 0;
    if (tokenEpoch !== epoch) return null;
    return { role: "admin", epoch };
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  return (await readAdminSession(token)) !== null;
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
  if (stored?.password_hash?.startsWith("scrypt$")) {
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

export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<{ ok: true; role: AdminRole } | "unconfigured" | "invalid" | "unavailable"> {
  const uname = username.trim();
  if (uname) {
    const expectedUser = superAdminUsername() ?? "\0super-admin-unconfigured";
    const expectedPass = superAdminPassword() ?? `\0${"x".repeat(MIN_PASSWORD_LENGTH)}`;
    const userOk = secretsMatch(uname, expectedUser);
    const passOk = secretsMatch(password, expectedPass);
    if (!superAdminConfigured() || !userOk || !passOk) {
      await writeAudit("unknown", "login_fail");
      return "invalid";
    }
    const token = await signAdminToken({ role: "super_admin" });
    setAdminCookie(token);
    await writeAudit("super_admin", "login_success");
    return { ok: true, role: "super_admin" };
  }

  const result = await verifyLoginPassword(password);
  if (result !== "ok") {
    if (result === "invalid") await writeAudit("admin", "login_fail");
    return result;
  }
  const token = await signAdminToken({ role: "admin" });
  setAdminCookie(token);
  await writeAudit("admin", "login_success");
  return { ok: true, role: "admin" };
}

export async function loginWithPassword(
  password: string,
): Promise<"ok" | "unconfigured" | "invalid" | "unavailable"> {
  const result = await loginWithCredentials("", password);
  return typeof result === "object" ? "ok" : result;
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
    const token = await signAdminToken({ epoch, role: "admin" });
    setAdminCookie(token);
    await writeAudit("admin", "password_change");
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
    await writeAudit("admin", "password_recover");
    return "ok";
  } catch {
    return "unavailable";
  }
}

export async function resetAdminPassword(
  newPassword: string,
): Promise<"ok" | "weak" | "unavailable"> {
  if (!passwordStrength(newPassword)) return "weak";
  try {
    await savePasswordHash(await hashPassword(newPassword));
    await writeAudit("super_admin", "password_reset");
    return "ok";
  } catch {
    return "unavailable";
  }
}

export async function logoutAllAdminSessions(): Promise<"ok" | "unavailable"> {
  try {
    const { getSql } = await import("./db");
    const sql = await getSql();
    await sql`
      insert into admin_auth (id, password_hash, session_epoch, updated_at)
      values (1, '', 1, now())
      on conflict (id) do update set
        session_epoch = admin_auth.session_epoch + 1,
        updated_at = now()
    `;
    await writeAudit("super_admin", "logout_all");
    return "ok";
  } catch {
    return "unavailable";
  }
}

export async function listAdminAccounts(): Promise<
  { username: string; role: AdminRole; source: "database" | "environment"; passwordSet: boolean }[]
> {
  const stored = await loadAdminAuth();
  const accounts: { username: string; role: AdminRole; source: "database" | "environment"; passwordSet: boolean }[] = [
    {
      username: "admin",
      role: "admin",
      source: stored?.password_hash?.startsWith("scrypt$") ? "database" : "environment",
      passwordSet: Boolean(stored?.password_hash?.startsWith("scrypt$") || adminPassword()),
    },
  ];
  if (superAdminConfigured()) {
    accounts.unshift({
      username: superAdminUsername() ?? "super_admin",
      role: "super_admin",
      source: "environment",
      passwordSet: true,
    });
  }
  return accounts;
}

export async function listAuditLogs(limit = 100): Promise<
  { id: number; actorRole: string; action: string; detail: string; ip: string; createdAt: string }[]
> {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    actor_role: string;
    action: string;
    detail: string;
    ip: string;
    created_at: string | Date;
  }>`
    select id, actor_role, action, detail, ip, created_at
    from admin_audit_log
    order by created_at desc, id desc
    limit ${Math.min(Math.max(limit, 1), 200)}
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    actorRole: row.actor_role,
    action: row.action,
    detail: row.detail ?? "",
    ip: row.ip ?? "",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }));
}

export function readAdminCookie(): string | undefined {
  return getCookie(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<AdminSession> {
  setResponseHeader("cache-control", "no-store");
  setResponseHeader("vary", "Cookie");
  const cookie = getCookie(ADMIN_COOKIE);
  const session = await readAdminSession(cookie);
  if (!session) {
    setResponseStatus(401);
    throw new Error("प्रशासन लॉगिन आवश्यक है");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (session.role !== "super_admin") {
    setResponseStatus(403);
    throw new Error("यह कार्य केवल सुपर एडमिन कर सकते हैं।");
  }
  return session;
}

export function requestUrl(): URL {
  try {
    return getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  } catch {
    return new URL(getRequest().url);
  }
}
