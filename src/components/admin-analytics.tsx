import { statusLabel } from "@/lib/camp";
import { Card } from "@/components/ui/card";

function BarList({
  items,
}: {
  items: { key: string; label: string; n: number }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.n));
  if (items.length === 0) {
    return <p className="text-sm text-muted">अभी आँकड़े उपलब्ध नहीं हैं।</p>;
  }
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-navy">{item.label}</span>
            <span className="tabular-nums font-medium text-maroon">{item.n}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cream">
            <div
              className="h-full rounded-full bg-saffron"
              style={{ width: `${Math.max(6, (item.n / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function AdminAnalytics({
  byDate,
  byBlock,
  byStatus,
}: {
  byDate: { day: string; n: number }[];
  byBlock: { block: string; n: number }[];
  byStatus: { status: string; n: number }[];
}) {
  return (
    <section className="mt-5 grid gap-3 lg:grid-cols-3">
      <Card>
        <h2 className="font-display text-lg text-navy">पंजीकरण तिथि अनुसार</h2>
        <div className="mt-3">
          <BarList items={byDate.map((row) => ({ key: row.day, label: formatDay(row.day), n: row.n }))} />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-lg text-navy">ब्लॉक अनुसार</h2>
        <div className="mt-3">
          <BarList items={byBlock.map((row) => ({ key: row.block, label: row.block, n: row.n }))} />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-lg text-navy">स्थिति वितरण</h2>
        <div className="mt-3">
          <BarList
            items={byStatus.map((row) => ({
              key: row.status,
              label: statusLabel(row.status),
              n: row.n,
            }))}
          />
        </div>
      </Card>
    </section>
  );
}

export function VisitAnalytics({
  visitsByDay,
  registrationsByDay,
  visitsVsRegistrations,
  detailed,
  daily,
}: {
  visitsByDay: { day: string; n: number }[];
  registrationsByDay: { day: string; n: number }[];
  visitsVsRegistrations: { day: string; visits: number; registrations: number }[];
  detailed?: boolean;
  daily?: { day: string; visits: number; uniques: number; registrations: number }[];
}) {
  const maxVisit = Math.max(1, ...visitsByDay.map((row) => row.n));
  const maxReg = Math.max(1, ...registrationsByDay.map((row) => row.n));
  const maxDual = Math.max(
    1,
    ...visitsVsRegistrations.flatMap((row) => [row.visits, row.registrations]),
  );
  const visitRows = [...visitsByDay].reverse();
  const regRows = [...registrationsByDay].reverse();
  const compareRows = [...visitsVsRegistrations].reverse();
  const tableRows = daily ? [...daily].reverse() : [];

  return (
    <section className="mt-5 grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg text-navy">समय के साथ विज़िट</h2>
          <p className="mt-1 text-xs text-muted">नवीनतम पहले</p>
          <div className="mt-3">
            <VisitBarList
              items={visitRows.map((row) => ({
                key: row.day,
                label: formatVisitDay(row.day),
                n: row.n,
              }))}
              max={maxVisit}
              tone="navy"
            />
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-lg text-navy">समय के साथ पंजीकरण</h2>
          <p className="mt-1 text-xs text-muted">नवीनतम पहले</p>
          <div className="mt-3">
            <VisitBarList
              items={regRows.map((row) => ({
                key: row.day,
                label: formatVisitDay(row.day),
                n: row.n,
              }))}
              max={maxReg}
              tone="saffron"
            />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg text-navy">विज़िट बनाम पंजीकरण</h2>
            <p className="mt-1 text-xs text-muted">उसी दिन की तुलना · नवीनतम पहले</p>
          </div>
          <ul className="flex flex-wrap gap-3 text-xs text-muted">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-navy" aria-hidden="true" />
              विज़िट
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-saffron" aria-hidden="true" />
              पंजीकरण
            </li>
          </ul>
        </div>
        <div className="mt-4">
          {compareRows.length === 0 ? (
            <p className="text-sm text-muted">अभी आँकड़े उपलब्ध नहीं हैं।</p>
          ) : (
            <ul className="grid gap-3">
              {compareRows.map((row) => (
                <li key={row.day} className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-navy">{formatVisitDay(row.day)}</span>
                    <span className="tabular-nums text-muted">
                      {row.visits} विज़िट · {row.registrations} पंजीकरण
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-navy"
                        style={{ width: barWidth(row.visits, maxDual) }}
                      />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-saffron"
                        style={{ width: barWidth(row.registrations, maxDual) }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {detailed && tableRows.length > 0 ? (
        <Card>
          <h2 className="font-display text-lg text-navy">विस्तृत आँकड़े</h2>
          <p className="mt-1 text-xs text-muted">Super Admin · दैनिक योग, बिना आगंतुक पहचान</p>
          <div className="mt-3 -mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2 pr-3 font-medium">तिथि</th>
                  <th className="pb-2 pr-3 font-medium">विज़िट</th>
                  <th className="pb-2 pr-3 font-medium">अद्वितीय (अनुमान)</th>
                  <th className="pb-2 font-medium">पंजीकरण</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.day} className="border-t border-line">
                    <td className="py-2 pr-3 text-navy">{formatVisitDay(row.day)}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.visits}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.uniques}</td>
                    <td className="py-2 tabular-nums">{row.registrations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function formatVisitDay(day: string): string {
  const date = new Date(`${day}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function barWidth(n: number, max: number): string {
  if (n <= 0) return "0%";
  return `${Math.max(4, Math.min(100, (n / max) * 100))}%`;
}

function VisitBarList({
  items,
  max,
  tone,
}: {
  items: { key: string; label: string; n: number }[];
  max: number;
  tone: "navy" | "saffron";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">अभी आँकड़े उपलब्ध नहीं हैं।</p>;
  }
  const fill = tone === "navy" ? "bg-navy" : "bg-saffron";
  return (
    <ul className="grid gap-2.5">
      {items.map((item) => (
        <li key={item.key} className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-navy">{item.label}</span>
            <span className="shrink-0 tabular-nums font-medium text-maroon">{item.n}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-cream">
            <div className={`h-full rounded-full ${fill}`} style={{ width: barWidth(item.n, max) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
