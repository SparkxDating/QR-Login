import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { tStatus, useDashboardI18n } from "@/components/dashboard-locale";

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
  empty,
}: {
  items: { key: string; label: string; n: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.n));
  if (items.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
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

function formatDay(day: string, locale: string): string {
  const date = new Date(`${day}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(locale, {
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
  const { t, locale } = useDashboardI18n();
  const empty = t("analytics.empty");
  return (
    <section className="mt-5 grid gap-3 lg:grid-cols-3">
      <ChartCard title={t("analytics.byDate")} accent="saffron">
        <BarList
          empty={empty}
          items={byDate.map((row) => ({ key: row.day, label: formatDay(row.day, locale), n: row.n }))}
        />
      </ChartCard>
      <ChartCard title={t("analytics.byBlock")} accent="navy">
        <BarList empty={empty} items={byBlock.map((row) => ({ key: row.block, label: row.block, n: row.n }))} />
      </ChartCard>
      <ChartCard title={t("analytics.byStatus")} accent="maroon">
        <BarList
          empty={empty}
          items={byStatus.map((row) => ({
            key: row.status,
            label: tStatus(t, row.status),
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
  const { t, locale } = useDashboardI18n();
  const empty = t("analytics.empty");
  const visitRows = [...visitsByDay].reverse();
  const regRows = [...registrationsByDay].reverse();
  const compareRows = [...visitsVsRegistrations].reverse();
  const tableRows = daily ? [...daily].reverse() : [];

  return (
    <section className="mt-5 grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard title={t("analytics.visitsOverTime")} hint={t("analytics.newestFirst")} accent="navy">
          <VisitBarList
            empty={empty}
            items={visitRows.map((row) => ({
              key: row.day,
              label: formatVisitDay(row.day, locale),
              n: row.n,
            }))}
            max={maxVisit}
            tone="navy"
          />
        </ChartCard>
        <ChartCard title={t("analytics.regsOverTime")} hint={t("analytics.newestFirst")} accent="saffron">
          <VisitBarList
            empty={empty}
            items={regRows.map((row) => ({
              key: row.day,
              label: formatVisitDay(row.day, locale),
              n: row.n,
            }))}
            max={maxReg}
            tone="saffron"
          />
        </ChartCard>
      </div>

      <ChartCard title={t("analytics.visitsVsRegs")} hint={t("analytics.compareHint")} accent="maroon">
        <ul className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-navy" aria-hidden="true" />
            {t("analytics.visits")}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-saffron" aria-hidden="true" />
            {t("analytics.registrations")}
          </li>
        </ul>
        {compareRows.length === 0 ? (
          <p className="text-sm text-muted">{empty}</p>
        ) : (
          <ul className="grid max-h-96 gap-2 overflow-y-auto pr-1">
            {compareRows.map((row) => (
              <li key={row.day} className="min-w-0 rounded-lg bg-cream px-3 py-2.5">
                <p className="mb-2 text-sm font-medium text-navy">{formatVisitDay(row.day, locale)}</p>
                <div className="grid gap-1.5">
                  <CompareBar label={t("analytics.visits")} value={row.visits} max={maxDual} tone="navy" />
                  <CompareBar label={t("analytics.registrations")} value={row.registrations} max={maxDual} tone="saffron" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>

      {detailed && tableRows.length > 0 ? (
        <ChartCard title={t("analytics.detailed")} hint={t("analytics.detailedHint")} accent="maroon">
          <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="bg-cream text-xs font-semibold tracking-wide text-muted">
                  <th className="rounded-l-md px-3 py-2 font-semibold">{t("analytics.date")}</th>
                  <th className="px-3 py-2 font-semibold">{t("analytics.visits")}</th>
                  <th className="px-3 py-2 font-semibold">{t("analytics.uniqueEst")}</th>
                  <th className="rounded-r-md px-3 py-2 font-semibold">{t("analytics.registrations")}</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.day} className="border-t border-line hover:bg-cream/70">
                    <td className="px-3 py-2 text-navy">{formatVisitDay(row.day, locale)}</td>
                    <td className="px-3 py-2 tabular-nums text-navy">{row.visits}</td>
                    <td className="px-3 py-2 tabular-nums text-navy">{row.uniques}</td>
                    <td className="px-3 py-2 tabular-nums text-navy">{row.registrations}</td>
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

function formatVisitDay(day: string, locale: string): string {
  const date = new Date(`${day}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(locale, {
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

function CompareBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "navy" | "saffron";
}) {
  const fill = tone === "navy" ? "bg-navy" : "bg-saffron";
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-muted">{label}</span>
      <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-paper">
        <div className={`h-full rounded-full ${fill}`} style={{ width: barWidth(value, max) }} />
      </div>
      <span className="w-10 shrink-0 text-right tabular-nums text-xs font-medium text-navy">{value}</span>
    </div>
  );
}

function VisitBarList({
  items,
  max,
  tone,
  empty,
}: {
  items: { key: string; label: string; n: number }[];
  max: number;
  tone: "navy" | "saffron";
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
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
