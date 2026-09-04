import { createHash } from "node:crypto";

function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function visitorKey(token: string): string | null {
  const raw = token.trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(raw)) return null;
  return createHash("sha256").update(`tsf-vid:${raw}`).digest("base64url").slice(0, 32);
}

export async function recordVisit(token: string, kind: "view" | "beat"): Promise<void> {
  const key = visitorKey(token);
  if (!key) return;
  const { getSql } = await import("./db");
  const sql = await getSql();

  if (kind === "beat") {
    const today = todayIst();
    const existing = await sql<{ last_day: string }>`
      select last_day::text as last_day from site_visitors where visitor_key = ${key}
    `;
    const prevDay = existing[0]?.last_day ? String(existing[0].last_day).slice(0, 10) : "";
    if (!existing[0] || prevDay === today) {
      await sql`
        update site_visitors
        set last_seen = now()
        where visitor_key = ${key}
      `;
      return;
    }
    const rolled = await sql<{ visitor_key: string }>`
      update site_visitors
      set last_seen = now(), last_day = ${today}::date
      where visitor_key = ${key} and last_day is distinct from ${today}::date
      returning visitor_key
    `;
    if (rolled[0]) {
      await sql`
        insert into site_visit_days (day, hits, uniques)
        values (${today}::date, 0, 1)
        on conflict (day) do update set
          uniques = site_visit_days.uniques + 1
      `;
    }
    return;
  }

  const today = todayIst();
  const existing = await sql<{ last_day: string }>`
    select last_day::text as last_day from site_visitors where visitor_key = ${key}
  `;
  const prevDay = existing[0]?.last_day ? String(existing[0].last_day).slice(0, 10) : "";
  const newUniqueToday = prevDay !== today;

  await sql`
    insert into site_visitors (visitor_key, first_seen, last_seen, hits, last_day)
    values (${key}, now(), now(), 1, ${today}::date)
    on conflict (visitor_key) do update set
      last_seen = now(),
      hits = site_visitors.hits + 1,
      last_day = excluded.last_day
  `;
  await sql`
    insert into site_visit_days (day, hits, uniques)
    values (${today}::date, 1, ${newUniqueToday ? 1 : 0})
    on conflict (day) do update set
      hits = site_visit_days.hits + 1,
      uniques = site_visit_days.uniques + ${newUniqueToday ? 1 : 0}
  `;
}

export type VisitStats = {
  totalVisits: number;
  uniqueVisitors: number;
  online: number;
  totalRegistrations: number;
  conversionRate: number;
  visitsByDay: { day: string; n: number }[];
  registrationsByDay: { day: string; n: number }[];
  visitsVsRegistrations: { day: string; visits: number; registrations: number }[];
  daily: { day: string; visits: number; uniques: number; registrations: number }[];
};

export async function loadVisitStats(days: number): Promise<VisitStats> {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const take = Math.min(Math.max(days, 7), 60);

  const [visitTotal] = await sql.query<{ n: number }>(
    "select coalesce(sum(hits), 0)::int as n from site_visit_days",
  );
  const [uniqueTotal] = await sql.query<{ n: number }>(
    "select count(*)::int as n from site_visitors",
  );
  const [onlineRow] = await sql.query<{ n: number }>(
    `select count(*)::int as n from site_visitors
     where last_seen > now() - interval '5 minutes'`,
  );
  const [regTotal] = await sql.query<{ n: number }>(
    "select count(*)::int as n from registrations",
  );
  const visitDays = await sql.query<{ day: string; hits: number; uniques: number }>(
    `select day::text as day, hits::int as hits, uniques::int as uniques
     from site_visit_days
     order by day desc
     limit ${take}`,
  );
  const regDays = await sql.query<{ day: string; n: number }>(
    `select (created_at at time zone 'Asia/Kolkata')::date::text as day, count(*)::int as n
     from registrations
     group by 1
     order by 1 desc
     limit ${take}`,
  );

  const totalVisits = Number(visitTotal?.n ?? 0);
  const uniqueVisitors = Number(uniqueTotal?.n ?? 0);
  const totalRegistrations = Number(regTotal?.n ?? 0);
  const conversionRate =
    uniqueVisitors > 0 ? Math.round((totalRegistrations / uniqueVisitors) * 1000) / 10 : 0;

  const visitMap = new Map(
    visitDays.map((row) => [String(row.day).slice(0, 10), Number(row.hits)]),
  );
  const uniqueMap = new Map(
    visitDays.map((row) => [String(row.day).slice(0, 10), Number(row.uniques)]),
  );
  const regMap = new Map(regDays.map((row) => [String(row.day).slice(0, 10), Number(row.n)]));
  const daysSet = new Set([...visitMap.keys(), ...regMap.keys()]);
  const merged = [...daysSet].sort();

  return {
    totalVisits,
    uniqueVisitors,
    online: Number(onlineRow?.n ?? 0),
    totalRegistrations,
    conversionRate,
    visitsByDay: [...visitMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, n]) => ({ day, n })),
    registrationsByDay: [...regMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, n]) => ({ day, n })),
    visitsVsRegistrations: merged.map((day) => ({
      day,
      visits: visitMap.get(day) ?? 0,
      registrations: regMap.get(day) ?? 0,
    })),
    daily: merged.map((day) => ({
      day,
      visits: visitMap.get(day) ?? 0,
      uniques: uniqueMap.get(day) ?? 0,
      registrations: regMap.get(day) ?? 0,
    })),
  };
}
