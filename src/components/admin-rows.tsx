import { STATUSES, statusLabel } from "@/lib/camp";
import type { RegistrationRow } from "@/lib/registrations";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { LoaderCircle, Users } from "lucide-react";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex size-11 items-center justify-center rounded-md bg-saffron/12 text-saffron">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="font-display text-2xl tabular-nums text-navy">{value}</p>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{k}:</dt>
      <dd className="min-w-0 text-ink">{v}</dd>
    </div>
  );
}

export function AdminRegistrationList({
  rows,
  loading,
  error,
  filteredCount,
  onStatus,
}: {
  rows: RegistrationRow[];
  loading: boolean;
  error: string;
  filteredCount: number;
  onStatus: (id: number, next: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm text-muted">
        दिखाए गए: <span className="tabular-nums font-medium text-navy">{filteredCount}</span>
      </p>
      {error ? (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" />
          लोड हो रहा है…
        </p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-center text-muted">कोई पंजीकरण नहीं मिला।</p>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl bg-paper p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg text-navy">{row.name}</p>
                  <p className="tabular-nums text-sm font-semibold text-maroon">
                    {row.registrationNumber}
                  </p>
                </div>
                <NativeSelect
                  className="min-h-10 w-auto min-w-44"
                  value={row.status}
                  onChange={(e) => void onStatus(row.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <Item k="पिता/पति" v={row.fatherOrHusbandName} />
                <Item k="मोबाइल" v={row.mobile} />
                <Item k="ग्राम" v={row.village} />
                <Item k="पोस्ट" v={row.post} />
                <Item k="न्याय पंचायत" v={row.nyayaPanchayat} />
                <Item k="ब्लॉक" v={row.block} />
                <Item k="तहसील" v={row.tehsil} />
                <Item k="जनपद" v={row.district} />
                <Item k="तिथि" v={formatWhen(row.createdAt)} />
                <Item k="स्थिति" v={statusLabel(row.status)} />
              </dl>
              {row.note ? (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-navy">नोट: </span>
                  {row.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
