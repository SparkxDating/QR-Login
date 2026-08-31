import { createServerFn } from "@tanstack/react-start";
import {
  adminListSchema,
  adminStatusSchema,
  adminTokenSchema,
  registrationInputSchema,
  type RegistrationRow,
} from "./registrations";
import { BLOCKS, CAMP } from "./camp";
import { csvCell, likeContains, sanitizeText } from "./sanitize";
import { z } from "zod";

type DbRegistration = {
  id: number;
  registration_number: string;
  name: string;
  father_or_husband_name: string;
  village: string;
  post: string;
  nyaya_panchayat: string;
  block: string;
  tehsil: string;
  district: string;
  mobile: string;
  note: string | null;
  status: string;
  created_at: string | Date;
};

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapRow(row: DbRegistration): RegistrationRow {
  return {
    id: Number(row.id),
    registrationNumber: row.registration_number,
    name: row.name,
    fatherOrHusbandName: row.father_or_husband_name,
    village: row.village,
    post: row.post,
    nyayaPanchayat: row.nyaya_panchayat,
    block: row.block,
    tehsil: row.tehsil,
    district: row.district,
    mobile: row.mobile,
    note: row.note ?? "",
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

export const submitRegistration = createServerFn({ method: "POST" })
  .validator(registrationInputSchema)
  .handler(async ({ data }) => {
    const { assertSameOriginWrite, clientKey } = await import(
      "./admin-session.server"
    );
    const { allowRequest } = await import("./rate-limit.server");
    const { getSql } = await import("./db");
    const { setResponseStatus } = await import("@tanstack/react-start/server");

    assertSameOriginWrite();
    if (!allowRequest(clientKey("register"), 8, 15 * 60 * 1000)) {
      setResponseStatus(429);
      return { ok: false as const, error: "\u0915\u0943\u092a\u092f\u093e \u0915\u0941\u091b \u0926\u0947\u0930 \u092c\u093e\u0926 \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902\u0964" };
    }

    if (data.website && data.website.trim().length > 0) {
      return { ok: true as const, registrationNumber: "TSF-2026-HOLD" };
    }

    const name = sanitizeText(data.name);
    const fatherOrHusbandName = sanitizeText(data.fatherOrHusbandName);
    const village = sanitizeText(data.village);
    const post = sanitizeText(data.post);
    const nyayaPanchayat = sanitizeText(data.nyayaPanchayat);
    const tehsil = sanitizeText(data.tehsil);
    const district = sanitizeText(data.district) || CAMP.districtDefault;
    const mobile = sanitizeText(data.mobile, 10);
    const note = sanitizeText(data.note ?? "", 500);
    const block = data.block;

    if (!BLOCKS.includes(block)) {
      return { ok: false as const, error: "\u092c\u094d\u0932\u0949\u0915 \u091a\u0941\u0928\u0947\u0902 \u2014 \u091a\u0939\u0928\u093f\u092f\u093e\u0901 \u092f\u093e \u0938\u0915\u0932\u0921\u0940\u0939\u093e" };
    }

    const sql = await getSql();
    const rows = await sql<DbRegistration>`
      insert into registrations (
        registration_number, name, father_or_husband_name, village, post,
        nyaya_panchayat, block, tehsil, district, mobile, note
      ) values (
        'TSF-2026-' || lpad(nextval('registration_number_seq')::text, 5, '0'),
        ${name},
        ${fatherOrHusbandName},
        ${village},
        ${post},
        ${nyayaPanchayat},
        ${block},
        ${tehsil},
        ${district},
        ${mobile},
        ${note.length > 0 ? note : null}
      )
      returning *
    `;
    const row = rows[0];
    if (!row) {
      return { ok: false as const, error: "\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0938\u0939\u0947\u091c\u093e \u0928\u0939\u0940\u0902 \u091c\u093e \u0938\u0915\u093e\u0964 \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902\u0964" };
    }
    return { ok: true as const, registrationNumber: row.registration_number };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1, "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0906\u0935\u0936\u094d\u092f\u0915 \u0939\u0948") }))
  .handler(async ({ data }) => {
    const {
      assertSameOriginWrite,
      clientKey,
      loginWithPassword,
      usingPreviewAdminPassword,
    } = await import("./admin-session.server");
    const { allowRequest } = await import("./rate-limit.server");
    const { setResponseStatus } = await import("@tanstack/react-start/server");

    assertSameOriginWrite();
    if (!allowRequest(clientKey("admin-login"), 8, 15 * 60 * 1000)) {
      setResponseStatus(429);
      return { ok: false as const, error: "\u092c\u0939\u0941\u0924 \u0905\u0927\u093f\u0915 \u092a\u094d\u0930\u092f\u093e\u0938\u0964 \u0915\u0941\u091b \u0926\u0947\u0930 \u092c\u093e\u0926 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964" };
    }
    const token = await loginWithPassword(data.password);
    if (!token) {
      return { ok: false as const, error: "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0917\u0932\u0924 \u0939\u0948\u0964" };
    }
    return {
      ok: true as const,
      token,
      previewHint: usingPreviewAdminPassword(),
    };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAdminCookie } = await import("./admin-session.server");
  clearAdminCookie();
  return { ok: true as const };
});

export const checkAdminSession = createServerFn({ method: "POST" })
  .validator(adminTokenSchema)
  .handler(async ({ data }) => {
    const { readAdminCookie, verifyAdminToken, usingPreviewAdminPassword } =
      await import("./admin-session.server");
    const cookie = readAdminCookie();
    const authed =
      (await verifyAdminToken(cookie)) || (await verifyAdminToken(data.token));
    return { authed, previewHint: usingPreviewAdminPassword() };
  });

export const listRegistrations = createServerFn({ method: "POST" })
  .validator(adminListSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    const { getSql } = await import("./db");
    await requireAdmin(data.token);
    const sql = await getSql();

    const name = sanitizeText(data.name, 80);
    const mobile = sanitizeText(data.mobile, 10);
    const block = sanitizeText(data.block, 40);
    const nyaya = sanitizeText(data.nyayaPanchayat, 80);
    const date = sanitizeText(data.date, 10);
    const status = sanitizeText(data.status, 40);

    const filters: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      filters.push(clause.replace("?", `$${params.length}`));
    };

    if (name) add("name ilike ?", likeContains(name));
    if (mobile) add("mobile like ?", `${mobile.replace(/\D/g, "")}%`);
    if (block) add("block = ?", block);
    if (nyaya) add("nyaya_panchayat ilike ?", likeContains(nyaya));
    if (status) add("status = ?", status);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      add("(created_at at time zone 'Asia/Kolkata')::date = ?::date", date);
    }

    const where = filters.length > 0 ? `where ${filters.join(" and ")}` : "";
    const rows = await sql.query<DbRegistration>(
      `select * from registrations ${where} order by created_at desc, id desc limit 2000`,
      params,
    );
    const [totalRow] = await sql.query<{ n: number }>(
      "select count(*)::int as n from registrations",
    );
    const [todayRow] = await sql.query<{ n: number }>(
      `select count(*)::int as n from registrations
       where (created_at at time zone 'Asia/Kolkata')::date
           = (now() at time zone 'Asia/Kolkata')::date`,
    );
    const nyayaRows = await sql.query<{ nyaya_panchayat: string }>(
      `select distinct nyaya_panchayat from registrations
       order by nyaya_panchayat asc`,
    );

    return {
      rows: rows.map(mapRow),
      total: Number(totalRow?.n ?? 0),
      today: Number(todayRow?.n ?? 0),
      nyayaPanchayats: nyayaRows.map((r) => r.nyaya_panchayat),
    };
  });

export const updateRegistrationStatus = createServerFn({ method: "POST" })
  .validator(adminStatusSchema)
  .handler(async ({ data }) => {
    const { requireAdmin, assertSameOriginWrite } = await import(
      "./admin-session.server"
    );
    const { getSql } = await import("./db");
    assertSameOriginWrite();
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<DbRegistration>`
      update registrations
      set status = ${data.status}
      where id = ${data.id}
      returning *
    `;
    const row = rows[0];
    if (!row) throw new Error("\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0928\u0939\u0940\u0902 \u092e\u093f\u0932\u093e");
    return mapRow(row);
  });

export const exportRegistrationsCsv = createServerFn({ method: "POST" })
  .validator(adminTokenSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    const { getSql } = await import("./db");
    await requireAdmin(data.token);
    const sql = await getSql();
    const rows = await sql<DbRegistration>`
      select * from registrations order by id asc
    `;
    const header = [
      "registrationNumber",
      "name",
      "fatherOrHusbandName",
      "village",
      "post",
      "nyayaPanchayat",
      "block",
      "tehsil",
      "district",
      "mobile",
      "note",
      "status",
      "createdAt",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) => {
        const mapped = mapRow(row);
        return [
          mapped.registrationNumber,
          mapped.name,
          mapped.fatherOrHusbandName,
          mapped.village,
          mapped.post,
          mapped.nyayaPanchayat,
          mapped.block,
          mapped.tehsil,
          mapped.district,
          mapped.mobile,
          mapped.note,
          mapped.status,
          mapped.createdAt,
        ]
          .map((cell) => csvCell(String(cell)))
          .join(",");
      }),
    ];
    return { csv: `\uFEFF${lines.join("\n")}` };
  });
