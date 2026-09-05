import { type ReactNode } from "react";
import { statusLabel } from "@/lib/camp";
import { Card } from "@/components/ui/card";

function ChartCard({
  title,
  hint,
  accent = "saffron",
  children,
}: {
  title: string;
  hint?: string;
  accent?: "navy" | "saffron" | "maroon";
  children: ReactNode;
}) {
  const bar =
    accent === "navy" ? "bg-navy" : accent === "maroon" ? "bg-maroon" : "bg-saffron";
  return (
    <Card className="overflow-hidden p-0 sm:p-0">
      <div className={`h-1 ${bar}`} aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <h2 className="font-display text-lg text-navy">{title}</h2>
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        <div className="mt-4">{children}</div>
      </div>
    </Card>
  );
}

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
    <ul className="grid max-h-80 gap-2.5 overflow-y-auto pr-1">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-navy">{item.label}</span>
            <span className="tabular-nums font-medium text-maroon">{item.n}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-cream">
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
      <ChartCard title="पंजीकरण तिथि अनुसार" accent="saffron">
        <BarList items={byDate.map((row) => ({ key: row.day, label: formatDay(row.day), n: row.n }))} />
      </ChartCard>
      <ChartCard title="ब्लॉक अनुसार" accent="navy">
        <BarList items={byBlock.map((row) => ({ key: row.block, label: row.block, n: row.n }))} />
      </ChartCard>
      <ChartCard title="स्थिति वितरण" accent="maroon">
        <BarList
          items={byStatus.map((row) => ({
            key: row.status,
            label: statusLabel(row.status),
            n: row.n,
          }))}
        />
      </ChartCard>
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
        <ChartCard title="समय के साथ विज़िट" hint="नवीनतम पहले" accent="navy">
          <VisitBarList
            items={visitRows.map((row) => ({
              key: row.day,
              label: formatVisitDay(row.day),
              n: row.n,
            }))}
            max={maxVisit}
            tone="navy"
          />
        </ChartCard>
        <ChartCard title="समय के साथ पंजीकरण" hint="नवीनतम पहले" accent="saffron">
          <VisitBarList
            items={regRows.map((row) => ({
              key: row.day,
              label: formatVisitDay(row.day),
              n: row.n,
            }))}
            max={maxReg}
            tone="saffron"
          />
        </ChartCard>
      </div>

      <ChartCard title="विज़िट बनाम पंजीकरण" hint="उसी दिन की तुलना · नवीनतम पहले" accent="maroon">
        <ul className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-navy" aria-hidden="true" />
            विज़िट
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-saffron" aria-hidden="true" />
            पंजीकरण
          </li>
        </ul>
        {compareRows.length === 0 ? (
          <p className="text-sm text-muted">अभी आँकड़े उपलब्ध नहीं हैं।</p>
        ) : (
          <ul className="grid max-h-96 gap-2 overflow-y-auto pr-1">
            {compareRows.map((row) => (
              <li key={row.day} className="min-w-0 rounded-lg bg-cream px-3 py-2.5">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-navy">{formatVisitDay(row.day)}</span>
                  <span className="tabular-nums text-muted">
                    {row.visits} विज़िट · {row.registrations} पंजीकरण
                  </span>
                </div>
                <div className="grid gap-1.5">
                  <div className="h-3 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-navy"
                      style={{ width: barWidth(row.visits, maxDual) }}
                    />
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-paper">
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
      </ChartCard>

      {detailed && tableRows.length > 0 ? (
        <ChartCard title="विस्तृत आँकड़े" hint="Super Admin · दैनिक योग, बिना आगंतुक पहचान" accent="maroon">
          <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
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
        </ChartCard>
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
    <ul className="grid max-h-80 gap-2.5 overflow-y-auto pr-1">
      {items.map((item) => (
        <li key={item.key} className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-navy">{item.label}</span>
            <span className="shrink-0 tabular-nums font-medium text-maroon">{item.n}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-cream">
            <div className={`h-full rounded-full ${fill}`} style={{ width: barWidth(item.n, max) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
