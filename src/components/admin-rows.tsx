import { useEffect, useState, type ReactNode } from "react";
import { OTHER_STATUSES, WORKFLOW_STATUSES, statusLabel } from "@/lib/camp";
import { duplicateLabel, type RegistrationRow } from "@/lib/registrations";
import {
  openPdfPreviewWindow,
  printRegistrationPdf,
  saveRegistrationPdf,
  slipDetailsFromRow,
} from "@/lib/registration-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Download, Eye, LoaderCircle, Printer, Trash2, Users } from "lucide-react";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function Stat({
  label,
  value,
  icon,
  suffix,
  hint,
  trend,
}: {
  label: string;
  value: number | string;
  icon?: ReactNode;
  suffix?: string;
  hint?: string;
  trend?: { label: string; tone?: "success" | "muted" | "warn" };
}) {
  const trendClass =
    trend?.tone === "success" ? "text-success" : trend?.tone === "warn" ? "text-saffron" : "text-muted";
  return (
    <div className="rounded-xl border border-line bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-maroon/10 text-maroon">
          {icon ?? <Users className="size-5" aria-hidden="true" />}
        </div>
        {trend ? (
          <span className={`max-w-[9rem] text-right text-xs font-medium leading-snug ${trendClass}`}>
            {trend.label}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-3xl tabular-nums leading-none text-navy">
        {value}
        {suffix ?? ""}
      </p>
      <p className="mt-2 text-sm font-medium text-navy">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "operation_completed" || status === "follow_up"
      ? "bg-success/12 text-success"
      : status === "operation_recommended" || status === "operation_scheduled"
        ? "bg-saffron/15 text-maroon"
        : status === "screened"
          ? "bg-info/10 text-info"
          : status === "no_show" || status === "ineligible" || status === "cancelled"
            ? "bg-danger/10 text-danger"
            : "bg-cream text-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {statusLabel(status)}
    </span>
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
  const [busyId, setBusyId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<{ id: number; message: string } | null>(null);
  const [openPdf, setOpenPdf] = useState<{ id: number; url: string; filename: string } | null>(null);

  useEffect(() => {
    return () => {
      if (openPdf) URL.revokeObjectURL(openPdf.url);
    };
  }, [openPdf]);

  async function onDownloadSlip(row: RegistrationRow) {
    if (busyId !== null) return;
    setBusyId(row.id);
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
      setBusyId(null);
    }
  }

  async function onPrintSlip(row: RegistrationRow) {
    if (busyId !== null) return;
    setBusyId(row.id);
    setDownloadError(null);
    try {
      await printRegistrationPdf(row.registrationNumber, slipDetailsFromRow(row));
    } catch {
      setDownloadError({ id: row.id, message: "प्रिंट नहीं हो सका। कृपया पुनः प्रयास करें।" });
    } finally {
      setBusyId(null);
    }
  }

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          दिखाए गए: <span className="tabular-nums font-semibold text-navy">{filteredCount}</span>
        </p>
        {rows.length > 0 ? (
          <label className="flex min-h-10 items-center gap-2 text-sm text-navy">
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
        <p className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
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
        <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-cream text-xs font-semibold tracking-wide text-muted">
                  <th className="sticky left-0 bg-cream px-3 py-3 font-semibold"> </th>
                  <th className="px-3 py-3 font-semibold">पंजीकरण संख्या</th>
                  <th className="px-3 py-3 font-semibold">रोगी का नाम</th>
                  <th className="px-3 py-3 font-semibold">मोबाइल</th>
                  <th className="px-3 py-3 font-semibold">ग्राम</th>
                  <th className="px-3 py-3 font-semibold">ब्लॉक</th>
                  <th className="px-3 py-3 font-semibold">पंजीकरण तिथि</th>
                  <th className="px-3 py-3 font-semibold">स्थिति</th>
                  <th className="px-3 py-3 font-semibold">कार्य</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="bg-paper hover:bg-cream/80">
                    <td className="sticky left-0 border-t border-line bg-paper px-3 py-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-saffron"
                        checked={selected.has(row.id)}
                        onChange={() => onToggle(row.id)}
                        aria-label={`${row.name} चुनें`}
                      />
                    </td>
                    <td className="border-t border-line px-3 py-3 font-semibold tabular-nums text-maroon">
                      {row.registrationNumber}
                    </td>
                    <td className="border-t border-line px-3 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-navy hover:underline"
                        onClick={() => onOpen(row)}
                      >
                        {row.name}
                      </button>
                      {row.duplicate ? (
                        <p className="mt-1 text-xs text-maroon">{duplicateLabel(row.duplicate)}</p>
                      ) : null}
                    </td>
                    <td className="border-t border-line px-3 py-3 tabular-nums text-navy">{row.mobile}</td>
                    <td className="border-t border-line px-3 py-3 text-navy">{row.village}</td>
                    <td className="border-t border-line px-3 py-3 text-navy">{row.block}</td>
                    <td className="border-t border-line px-3 py-3 text-muted">{formatWhen(row.createdAt)}</td>
                    <td className="border-t border-line px-3 py-3">
                      <div className="grid gap-2">
                        <StatusBadge status={row.status} />
                        <StatusSelect
                          className="min-h-10 min-w-40"
                          value={row.status}
                          onChange={(next) => void onStatus(row.id, next)}
                        />
                      </div>
                    </td>
                    <td className="border-t border-line px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button variant="secondary" size="sm" onClick={() => onOpen(row)}>
                          <Eye className="size-4" aria-hidden="true" />
                          देखें
                        </Button>
                        <Button
                          variant="navy"
                          size="sm"
                          disabled={busyId !== null}
                          onClick={() => void onDownloadSlip(row)}
                        >
                          {busyId === row.id ? (
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Download className="size-4" aria-hidden="true" />
                          )}
                          PDF
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId !== null}
                          onClick={() => void onPrintSlip(row)}
                        >
                          <Printer className="size-4" aria-hidden="true" />
                          प्रिंट
                        </Button>
                        {canDelete ? (
                          <Button variant="danger" size="sm" onClick={() => onDelete?.(row)}>
                            <Trash2 className="size-4" aria-hidden="true" />
                            हटाएँ
                          </Button>
                        ) : null}
                      </div>
                      {downloadError?.id === row.id ? (
                        <p className="mt-2 text-xs text-danger">{downloadError.message}</p>
                      ) : null}
                      {openPdf?.id === row.id ? (
                        <a
                          href={openPdf.url}
                          target="_blank"
                          className="mt-2 inline-block text-xs font-semibold text-maroon hover:underline"
                        >
                          PDF खोलें / सेव करें
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
