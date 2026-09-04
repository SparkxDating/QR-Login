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
  const maxDual = Math.max(
    1,
    ...visitsVsRegistrations.flatMap((row) => [row.visits, row.registrations]),
  );

  return (
    <section className="mt-5 grid gap-3 lg:grid-cols-3">
      <Card>
        <h2 className="font-display text-lg text-navy">Visits by day</h2>
        <div className="mt-3">
          <BarList
            items={visitsByDay.map((row) => ({
              key: row.day,
              label: formatDay(row.day),
              n: row.n,
            }))}
          />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-lg text-navy">Registrations by day</h2>
        <div className="mt-3">
          <BarList
            items={registrationsByDay.map((row) => ({
              key: row.day,
              label: formatDay(row.day),
              n: row.n,
            }))}
          />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-lg text-navy">Visits vs registrations</h2>
        <div className="mt-3">
          {visitsVsRegistrations.length === 0 ? (
            <p className="text-sm text-muted">अभी आँकड़े उपलब्ध नहीं हैं।</p>
          ) : (
            <ul className="grid gap-3">
              {visitsVsRegistrations.map((row) => (
                <li key={row.day}>
                  <p className="mb-1 text-sm text-navy">{formatDay(row.day)}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-navy"
                      style={{ width: `${Math.max(6, (row.visits / maxDual) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-saffron"
                      style={{ width: `${Math.max(6, (row.registrations / maxDual) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Visits {row.visits} · Registrations {row.registrations}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      {detailed && daily && daily.length > 0 ? (
        <Card className="lg:col-span-3">
          <h2 className="font-display text-lg text-navy">Detailed analytics</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2 font-medium">Day</th>
                  <th className="pb-2 font-medium">Visits</th>
                  <th className="pb-2 font-medium">Uniques</th>
                  <th className="pb-2 font-medium">Registrations</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().map((row) => (
                  <tr key={row.day} className="border-t border-line">
                    <td className="py-1.5 text-navy">{formatDay(row.day)}</td>
                    <td className="py-1.5 tabular-nums">{row.visits}</td>
                    <td className="py-1.5 tabular-nums">{row.uniques}</td>
                    <td className="py-1.5 tabular-nums">{row.registrations}</td>
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
