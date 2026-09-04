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
