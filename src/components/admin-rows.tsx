import { useEffect, useState, type ReactNode } from "react";
import { OTHER_STATUSES, WORKFLOW_STATUSES, statusLabel } from "@/lib/camp";
import { duplicateLabel, type RegistrationRow } from "@/lib/registrations";
import { saveRegistrationPdf, openPdfPreviewWindow, slipDetailsFromRow } from "@/lib/registration-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Download, LoaderCircle, Trash2, Users } from "lucide-react";

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

export function Stat({
  label,
  value,
  icon,
  suffix,
  hint,
}: {
  label: string;
  value: number | string;
  icon?: ReactNode;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-saffron/12 text-saffron">
        {icon ?? <Users className="size-5" aria-hidden="true" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-snug text-muted">{label}</p>
        <p className="font-display text-2xl tabular-nums text-navy">
          {value}
          {suffix ?? ""}
        </p>
        {hint ? <p className="mt-0.5 text-xs leading-snug text-muted">{hint}</p> : null}
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

export function StatusSelect({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <NativeSelect
      id={id}
      className={className ?? "min-h-10 w-auto min-w-44"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <optgroup label="कार्यप्रवाह">
        {WORKFLOW_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="अन्य">
        {OTHER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </optgroup>
    </NativeSelect>
  );
}

export function AdminRegistrationList({
  rows,
  loading,
  error,
  filteredCount,
  selected,
  canDelete,
  onToggle,
  onToggleAll,
  onStatus,
  onOpen,
  onDelete,
}: {
  rows: RegistrationRow[];
  loading: boolean;
  error: string;
  filteredCount: number;
  selected: Set<number>;
  canDelete?: boolean;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onStatus: (id: number, next: string) => void;
  onOpen: (row: RegistrationRow) => void;
  onDelete?: (row: RegistrationRow) => void;
}) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<{ id: number; message: string } | null>(null);
  const [openPdf, setOpenPdf] = useState<{ id: number; url: string; filename: string } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (openPdf) URL.revokeObjectURL(openPdf.url);
    };
  }, [openPdf]);

  async function onDownloadSlip(row: RegistrationRow) {
    if (downloadingId !== null) return;
    setDownloadingId(row.id);
    setDownloadError(null);
    if (openPdf) {
      URL.revokeObjectURL(openPdf.url);
      setOpenPdf(null);
    }
    const preview = openPdfPreviewWindow();
    try {
      const result = await saveRegistrationPdf(
        row.registrationNumber,
        slipDetailsFromRow(row),
        preview,
      );
      if (result.needsOpenFallback && result.openUrl) {
        setOpenPdf({ id: row.id, url: result.openUrl, filename: result.filename });
      }
    } catch {
      try {
        preview?.close();
      } catch {
        // Ignore a blocked close.
      }
      setDownloadError({
        id: row.id,
        message: "स्लिप PDF नहीं बन सका। कृपया पुनः प्रयास करें।",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  return (
    <div className="mt-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          दिखाए गए: <span className="tabular-nums font-medium text-navy">{filteredCount}</span>
        </p>
        {rows.length > 0 ? (
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              className="size-4 accent-saffron"
              checked={allSelected}
              onChange={onToggleAll}
            />
            सभी चुनें
          </label>
        ) : null}
      </div>
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
                <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-2 size-4 shrink-0 accent-saffron"
                    checked={selected.has(row.id)}
                    onChange={() => onToggle(row.id)}
                    aria-label={`${row.name} चुनें`}
                  />
                  <Button
                    variant="navy"
                    size="sm"
                    className="shrink-0"
                    disabled={downloadingId !== null}
                    onClick={() => void onDownloadSlip(row)}
                  >
                    {downloadingId === row.id ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="size-4" aria-hidden="true" />
                    )}
                    {downloadingId === row.id ? "PDF बन रहा है..." : "स्लिप डाउनलोड"}
                  </Button>
                  {openPdf?.id === row.id ? (
                    <a
                      href={openPdf.url}
                      target="_blank"
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-sm bg-paper px-3 text-sm font-semibold text-navy ring-1 ring-line"
                    >
                      PDF खोलें / सेव करें
                    </a>
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="danger"
                      size="sm"
                      className="shrink-0"
                      onClick={() => onDelete?.(row)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      पंजीकरण हटाएँ
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    className="min-w-0 rounded-sm text-left"
                    onClick={() => onOpen(row)}
                  >
                    <p className="font-display text-lg text-navy hover:underline">{row.name}</p>
                    <p className="tabular-nums text-sm font-semibold text-maroon">
                      {row.registrationNumber}
                    </p>
                    <p className="text-xs text-muted">विवरण खोलें</p>
                  </button>
                </div>
                <StatusSelect value={row.status} onChange={(next) => void onStatus(row.id, next)} />
              </div>
              {row.duplicate ? (
                <p className="mt-2 rounded-md bg-saffron/15 px-3 py-2 text-sm text-maroon" role="status">
                  {duplicateLabel(row.duplicate)}
                </p>
              ) : null}
              {downloadError?.id === row.id ? (
                <p className="mt-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                  {downloadError.message}
                </p>
              ) : null}
              {openPdf?.id === row.id ? (
                <p className="mt-2 text-sm text-muted">
                  PDF तैयार है। खोलें, फिर Share से Files में सेव करें।
                </p>
              ) : null}
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
