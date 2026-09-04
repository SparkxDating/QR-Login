import { createServerFn } from "@tanstack/react-start";
import {
  adminBulkStatusSchema,
  adminEditSchema,
  adminListSchema,
  adminStatusSchema,
  registrationCsv,
  registrationInputSchema,
  type DuplicateKind,
  type RegistrationRow,
} from "./registrations";
import { BLOCKS, CAMP } from "./camp";
import { likeContains, sanitizeText } from "./sanitize";
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
  screening_date?: string | Date | null;
  surgery_date?: string | Date | null;
  follow_up_date?: string | Date | null;
  follow_up_status?: string | null;
  follow_up_notes?: string | null;
};

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
}

function mapRow(row: DbRegistration, duplicate: DuplicateKind = ""): RegistrationRow {
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
    screeningDate: toDateOnly(row.screening_date),
    surgeryDate: toDateOnly(row.surgery_date),
    followUpDate: toDateOnly(row.follow_up_date),
    followUpStatus: row.follow_up_status ?? "",
    followUpNotes: row.follow_up_notes ?? "",
    duplicate,
  };
}

function dateOrNull(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function buildListFilters(data: z.infer<typeof adminListSchema>): {
  where: string;
  params: unknown[];
} {
  const name = sanitizeText(data.name, 80);
  const mobile = sanitizeText(data.mobile, 10);
  const village = sanitizeText(data.village, 80);
  const block = sanitizeText(data.block, 40);
  const nyaya = sanitizeText(data.nyayaPanchayat, 80);
  const date = sanitizeText(data.date, 10);
  const dateFrom = sanitizeText(data.dateFrom, 10);
  const dateTo = sanitizeText(data.dateTo, 10);
  const status = sanitizeText(data.status, 40);
  const registrationNumber = sanitizeText(data.registrationNumber, 40);

  const filters: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, value: unknown) => {
    params.push(value);
    filters.push(clause.replace("?", `$${params.length}`));
  };

  if (registrationNumber) add("registration_number ilike ?", likeContains(registrationNumber));
  if (name) add("name ilike ?", likeContains(name));
  if (mobile) add("mobile like ?", `${mobile.replace(/\D/g, "")}%`);
  if (village) add("village ilike ?", likeContains(village));
  if (block) add("block = ?", block);
  if (nyaya) add("nyaya_panchayat ilike ?", likeContains(nyaya));
  if (status) add("status = ?", status);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    add("(created_at at time zone 'Asia/Kolkata')::date >= ?::date", dateFrom);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    add("(created_at at time zone 'Asia/Kolkata')::date <= ?::date", dateTo);
  }
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) &&
    !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)
  ) {
    add("(created_at at time zone 'Asia/Kolkata')::date = ?::date", date);
  }

  return {
    where: filters.length > 0 ? `where ${filters.join(" and ")}` : "",
    params,
  };
}

const TECHNICAL_ERROR =
  "पंजीकरण सेवा में तकनीकी समस्या है। कृपया कुछ देर बाद पुनः प्रयास करें।";

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
      return { ok: false as const, error: "कृपया कुछ देर बाद पुनः प्रयास करें।" };
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
      return { ok: false as const, error: "कृपया ब्लॉक चुनें — चहनियाँ या सकलडीहा।" };
    }

    try {
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
        return { ok: false as const, error: "पंजीकरण सहेजा नहीं जा सका। पुनः प्रयास करें।" };
      }
      return { ok: true as const, registrationNumber: row.registration_number };
    } catch (err) {
      console.error("[register]", err);
      const message = err instanceof Error ? err.message : "";
      if (message === "अमान्य अनुरोध") {
        return { ok: false as const, error: message };
      }
      return { ok: false as const, error: TECHNICAL_ERROR };
    }
  });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      username: z.string().max(80).optional(),
      password: z.string().min(1, "पासवर्ड आवश्यक है"),
    }),
  )
  .handler(async ({ data }) => {
    const {
      assertSameOriginWrite,
      clientKey,
      loginWithCredentials,
    } = await import("./admin-session.server");
    const { allowRequest } = await import("./rate-limit.server");
    const { setResponseStatus } = await import("@tanstack/react-start/server");

    assertSameOriginWrite();
    if (!allowRequest(clientKey("admin-login"), 8, 15 * 60 * 1000)) {
      setResponseStatus(429);
      return { ok: false as const, error: "बहुत अधिक प्रयास। कुछ देर बाद कोशिश करें।" };
    }
    const result = await loginWithCredentials(data.username ?? "", data.password);
    if (result === "unconfigured") {
      return {
        ok: false as const,
        error: "प्रशासन पासवर्ड कॉन्फ़िगर नहीं है। ADMIN_PASSWORD सेट करें।",
      };
    }
    if (result === "unavailable") {
      return { ok: false as const, error: "प्रशासन सेवा में समस्या है। कुछ देर बाद कोशिश करें।" };
    }
    if (result === "invalid") {
      return { ok: false as const, error: "पासवर्ड गलत है।" };
    }
    return { ok: true as const, role: result.role };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAdminCookie } = await import("./admin-session.server");
  clearAdminCookie();
  return { ok: true as const };
});

export const checkAdminSession = createServerFn({ method: "POST" }).handler(async () => {
  const { readAdminCookie, readAdminSession, adminAuthConfigured } = await import(
    "./admin-session.server"
  );
  const session = await readAdminSession(readAdminCookie());
  return {
    authed: session !== null,
    configured: await adminAuthConfigured(),
    role: session?.role ?? null,
  };
});

export const listRegistrations = createServerFn({ method: "POST" })
  .validator(adminListSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    const { getSql } = await import("./db");
    await requireAdmin();
    const sql = await getSql();
    const { where, params } = buildListFilters(data);

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
    const statusRows = await sql.query<{ status: string; n: number }>(
      "select status, count(*)::int as n from registrations group by status",
    );
    const dateRows = await sql.query<{ day: string; n: number }>(
      `select (created_at at time zone 'Asia/Kolkata')::date::text as day, count(*)::int as n
       from registrations
       group by 1
       order by 1 desc
       limit 30`,
    );
    const blockRows = await sql.query<{ block: string; n: number }>(
      "select block, count(*)::int as n from registrations group by block order by block asc",
    );
    const nyayaRows = await sql.query<{ nyaya_panchayat: string }>(
      `select distinct nyaya_panchayat from registrations
       order by nyaya_panchayat asc`,
    );
    const villageRows = await sql.query<{ village: string }>(
      `select distinct village from registrations order by village asc`,
    );
    const dupMobileRows = await sql.query<{ mobile: string }>(
      `select mobile from registrations
       where mobile is not null and mobile <> ''
       group by mobile having count(*) > 1`,
    );
    const dupNameRows = await sql.query<{ n: string; v: string }>(
      `select lower(trim(name)) as n, lower(trim(village)) as v
       from registrations
       group by 1, 2 having count(*) > 1`,
    );

    const dupMobiles = new Set(dupMobileRows.map((r) => r.mobile));
    const dupNames = new Set(dupNameRows.map((r) => `${r.n}|${r.v}`));
    const statusCounts: Record<string, number> = {};
    for (const row of statusRows) statusCounts[row.status] = Number(row.n);

    return {
      rows: rows.map((row) => {
        const mobileDup = dupMobiles.has(row.mobile);
        const nameDup = dupNames.has(`${row.name.trim().toLowerCase()}|${row.village.trim().toLowerCase()}`);
        const duplicate: DuplicateKind = mobileDup && nameDup ? "both" : mobileDup ? "mobile" : nameDup ? "name_village" : "";
        return mapRow(row, duplicate);
      }),
      total: Number(totalRow?.n ?? 0),
      today: Number(todayRow?.n ?? 0),
      pending: statusCounts.registered ?? 0,
      screened: statusCounts.screened ?? 0,
      selected: statusCounts.operation_recommended ?? 0,
      completed: statusCounts.operation_completed ?? 0,
      nyayaPanchayats: nyayaRows.map((r) => r.nyaya_panchayat),
      villages: villageRows.map((r) => r.village),
      byDate: dateRows
        .map((r) => ({ day: String(r.day).slice(0, 10), n: Number(r.n) }))
        .reverse(),
      byBlock: blockRows.map((r) => ({ block: r.block, n: Number(r.n) })),
      byStatus: statusRows.map((r) => ({ status: r.status, n: Number(r.n) })),
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
    await requireAdmin();
    const sql = await getSql();
    const rows = await sql<DbRegistration>`
      update registrations
      set status = ${data.status}
      where id = ${data.id}
      returning *
    `;
    const row = rows[0];
    if (!row) throw new Error("पंजीकरण नहीं मिला");
    return mapRow(row);
  });

export const bulkUpdateRegistrationStatus = createServerFn({ method: "POST" })
  .validator(adminBulkStatusSchema)
  .handler(async ({ data }) => {
    const { requireAdmin, assertSameOriginWrite, clientKey } = await import(
      "./admin-session.server"
    );
    const { allowRequest } = await import("./rate-limit.server");
    const { getSql } = await import("./db");
    const { setResponseStatus } = await import("@tanstack/react-start/server");
    assertSameOriginWrite();
    await requireAdmin();
    if (!allowRequest(clientKey("admin-bulk-status"), 20, 15 * 60 * 1000)) {
      setResponseStatus(429);
      throw new Error("बहुत अधिक प्रयास। कुछ देर बाद कोशिश करें।");
    }
    const sql = await getSql();
    const ids = data.ids;
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
    const rows = await sql.query<DbRegistration>(
      `update registrations set status = $1 where id in (${placeholders}) returning *`,
      [data.status, ...ids],
    );
    return { rows: rows.map((row) => mapRow(row)) };
  });

export const updateRegistration = createServerFn({ method: "POST" })
  .validator(adminEditSchema)
  .handler(async ({ data }) => {
    const { requireAdmin, assertSameOriginWrite } = await import(
      "./admin-session.server"
    );
    const { getSql } = await import("./db");
    assertSameOriginWrite();
    await requireAdmin();
    if (!BLOCKS.includes(data.block)) {
      throw new Error("कृपया ब्लॉक चुनें — चहनियाँ या सकलडीहा।");
    }
    const sql = await getSql();
    const note = sanitizeText(data.note ?? "", 500);
    const followUpNotes = sanitizeText(data.followUpNotes ?? "", 500);
    const rows = await sql<DbRegistration>`
      update registrations set
        name = ${sanitizeText(data.name)},
        father_or_husband_name = ${sanitizeText(data.fatherOrHusbandName)},
        village = ${sanitizeText(data.village)},
        post = ${sanitizeText(data.post)},
        nyaya_panchayat = ${sanitizeText(data.nyayaPanchayat)},
        block = ${data.block},
        tehsil = ${sanitizeText(data.tehsil)},
        district = ${sanitizeText(data.district)},
        mobile = ${sanitizeText(data.mobile, 10)},
        note = ${note.length > 0 ? note : null},
        status = ${data.status},
        screening_date = ${dateOrNull(data.screeningDate)},
        surgery_date = ${dateOrNull(data.surgeryDate)},
        follow_up_date = ${dateOrNull(data.followUpDate)},
        follow_up_status = ${data.followUpStatus ?? ""},
        follow_up_notes = ${followUpNotes.length > 0 ? followUpNotes : null}
      where id = ${data.id}
      returning *
    `;
    const row = rows[0];
    if (!row) throw new Error("पंजीकरण नहीं मिला");
    return mapRow(row);
  });

export const exportRegistrationsCsv = createServerFn({ method: "POST" })
  .validator(adminListSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    const { getSql } = await import("./db");
    await requireAdmin();
    const sql = await getSql();
    const { where, params } = buildListFilters(data);
    const rows = await sql.query<DbRegistration>(
      `select * from registrations ${where} order by id asc`,
      params,
    );
    return { csv: registrationCsv(rows.map((row) => mapRow(row))) };
  });

export const deleteRegistration = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int().positive(),
      confirm: z.literal(true),
    }),
  )
  .handler(async ({ data }) => {
    const { assertSameOriginWrite, clientKey, requireSuperAdmin, writeAudit } = await import(
      "./admin-session.server"
    );
    const { allowRequest } = await import("./rate-limit.server");
    const { getSql } = await import("./db");
    const { setResponseStatus } = await import("@tanstack/react-start/server");

    assertSameOriginWrite();
    await requireSuperAdmin();
    if (!allowRequest(clientKey("admin-delete"), 20, 15 * 60 * 1000)) {
      setResponseStatus(429);
      throw new Error("बहुत अधिक प्रयास। कुछ देर बाद कोशिश करें।");
    }
    const sql = await getSql();
    const rows = await sql<{ registration_number: string }>`
      delete from registrations
      where id = ${data.id}
      returning registration_number
    `;
    const row = rows[0];
    if (!row) {
      setResponseStatus(404);
      throw new Error("पंजीकरण नहीं मिला");
    }
    await writeAudit("super_admin", "registration_delete", row.registration_number);
    return { ok: true as const, message: "पंजीकरण सफलतापूर्वक हटाया गया।" };
  });
