import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BLOCKS,
  FOLLOW_UP_STATUSES,
  OTHER_STATUSES,
  WORKFLOW_STATUSES,
  type FollowUpStatus,
  type RegistrationStatus,
} from "@/lib/camp";
import { type RegistrationRow } from "@/lib/registrations";
import { tDuplicate, tFollowUp, tStatus, useDashboardI18n } from "@/components/dashboard-locale";
import { updateRegistration } from "@/lib/registrations.functions";
import {
  openPdfPreviewWindow,
  printRegistrationPdf,
  saveRegistrationPdf,
  slipDetailsFromRow,
} from "@/lib/registration-pdf";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin-rows";
import { Download, LoaderCircle, Printer, Trash2, X } from "lucide-react";

function formatWhen(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{k}:</dt>
      <dd className="min-w-0 text-ink">{v || "—"}</dd>
    </div>
  );
}

type FormState = {
  name: string;
  fatherOrHusbandName: string;
  village: string;
  post: string;
  nyayaPanchayat: string;
  block: string;
  tehsil: string;
  district: string;
  mobile: string;
  note: string;
  status: RegistrationStatus;
  screeningDate: string;
  surgeryDate: string;
  followUpDate: string;
  followUpStatus: "" | FollowUpStatus;
  followUpNotes: string;
};

function fromRow(row: RegistrationRow): FormState {
  return {
    name: row.name,
    fatherOrHusbandName: row.fatherOrHusbandName,
    village: row.village,
    post: row.post,
    nyayaPanchayat: row.nyayaPanchayat,
    block: row.block,
    tehsil: row.tehsil,
    district: row.district,
    mobile: row.mobile,
    note: row.note,
    status: row.status as RegistrationStatus,
    screeningDate: row.screeningDate,
    surgeryDate: row.surgeryDate,
    followUpDate: row.followUpDate,
    followUpStatus: (row.followUpStatus as FormState["followUpStatus"]) || "",
    followUpNotes: row.followUpNotes,
  };
}

export function AdminPatientProfile({
  row,
  canDelete,
  onClose,
  onSaved,
  onDelete,
}: {
  row: RegistrationRow;
  canDelete?: boolean;
  onClose: () => void;
  onSaved: (next: RegistrationRow) => void;
  onDelete?: (row: RegistrationRow) => void;
}) {
  const { t, locale } = useDashboardI18n();
  const [form, setForm] = useState<FormState>(() => fromRow(row));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<"download" | "print" | null>(null);
  const [openPdf, setOpenPdf] = useState<{ url: string; filename: string } | null>(null);

  useEffect(() => {
    setForm(fromRow(row));
    setEditing(false);
    setError("");
  }, [row]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (openPdf) URL.revokeObjectURL(openPdf.url);
    };
  }, [openPdf]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await updateRegistration({
        data: {
          id: row.id,
          name: form.name,
          fatherOrHusbandName: form.fatherOrHusbandName,
          village: form.village,
          post: form.post,
          nyayaPanchayat: form.nyayaPanchayat,
          block: form.block as (typeof BLOCKS)[number],
          tehsil: form.tehsil,
          district: form.district,
          mobile: form.mobile,
          note: form.note,
          status: form.status,
          screeningDate: form.screeningDate,
          surgeryDate: form.surgeryDate,
          followUpDate: form.followUpDate,
          followUpStatus: form.followUpStatus,
          followUpNotes: form.followUpNotes,
        },
      });
      onSaved({ ...updated, duplicate: row.duplicate });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.saveFail"));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (pdfBusy) return;
    setPdfBusy("download");
    setError("");
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
        setOpenPdf({ url: result.openUrl, filename: result.filename });
      }
    } catch {
      try {
        preview?.close();
      } catch {
        // Ignore a blocked close.
      }
      setError(t("profile.pdfFail"));
    } finally {
      setPdfBusy(null);
    }
  }

  async function onPrint() {
    if (pdfBusy) return;
    setPdfBusy("print");
    setError("");
    try {
      await printRegistrationPdf(row.registrationNumber, slipDetailsFromRow(row));
    } catch {
      setError(t("profile.printFail"));
    } finally {
      setPdfBusy(null);
    }
  }

  const warning = tDuplicate(t, row.duplicate);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[96dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-paper shadow-[var(--shadow-lift)] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 bg-maroon" aria-hidden="true" />
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-paper px-4 py-3">
          <div className="min-w-0">
            <p className="tabular-nums text-sm font-semibold text-maroon">{row.registrationNumber}</p>
            <h2 id="patient-profile-title" className="font-display text-xl text-navy">
              {row.name}
            </h2>
            <div className="mt-1">
              <StatusBadge status={row.status} />
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} aria-label={t("profile.close")}>
            <X className="size-4" aria-hidden="true" />
            {t("profile.close")}
          </Button>
        </header>

        <div className="px-4 py-4">
          {warning ? (
            <p className="mb-4 rounded-md bg-saffron/15 px-3 py-2 text-sm text-maroon" role="status">
              {warning}
            </p>
          ) : null}

          {editing ? (
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
              <Field label={t("profile.name")}>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label={t("profile.fatherName")}>
                <Input
                  value={form.fatherOrHusbandName}
                  onChange={(e) => set("fatherOrHusbandName", e.target.value)}
                  required
                />
              </Field>
              <Field label={t("profile.village")}>
                <Input value={form.village} onChange={(e) => set("village", e.target.value)} required />
              </Field>
              <Field label={t("profile.post")}>
                <Input value={form.post} onChange={(e) => set("post", e.target.value)} required />
              </Field>
              <Field label={t("profile.nyaya")}>
                <Input
                  value={form.nyayaPanchayat}
                  onChange={(e) => set("nyayaPanchayat", e.target.value)}
                  required
                />
              </Field>
              <Field label={t("profile.block")}>
                <NativeSelect value={form.block} onChange={(e) => set("block", e.target.value)} required>
                  {BLOCKS.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label={t("profile.tehsil")}>
                <Input value={form.tehsil} onChange={(e) => set("tehsil", e.target.value)} required />
              </Field>
              <Field label={t("profile.district")}>
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} required />
              </Field>
              <Field label={t("profile.mobile")}>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </Field>
              <Field label={t("profile.status")}>
                <NativeSelect
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as RegistrationStatus)}
                >
                  <optgroup label={t("status.groupWorkflow")}>
                    {WORKFLOW_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {tStatus(t, s.value)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t("status.groupOther")}>
                    {OTHER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {tStatus(t, s.value)}
                      </option>
                    ))}
                  </optgroup>
                </NativeSelect>
              </Field>
              <Field label={t("profile.note")} wide>
                <Textarea value={form.note} onChange={(e) => set("note", e.target.value)} maxLength={500} />
              </Field>

              <h3 className="sm:col-span-2 mt-2 font-display text-lg text-navy">{t("profile.followUp")}</h3>
              <Field label={t("profile.screeningDate")}>
                <Input
                  type="date"
                  value={form.screeningDate}
                  onChange={(e) => set("screeningDate", e.target.value)}
                />
              </Field>
              <Field label={t("profile.surgeryDate")}>
                <Input
                  type="date"
                  value={form.surgeryDate}
                  onChange={(e) => set("surgeryDate", e.target.value)}
                />
              </Field>
              <Field label={t("profile.followUpDate")}>
                <Input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => set("followUpDate", e.target.value)}
                />
              </Field>
              <Field label={t("profile.followUpStatus")}>
                <NativeSelect
                  value={form.followUpStatus}
                  onChange={(e) => set("followUpStatus", e.target.value as FormState["followUpStatus"])}
                >
                  <option value="">—</option>
                  {FOLLOW_UP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {tFollowUp(t, s.value)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label={t("profile.followUpNotes")} wide>
                <Textarea
                  value={form.followUpNotes}
                  onChange={(e) => set("followUpNotes", e.target.value)}
                  maxLength={500}
                />
              </Field>

              {error ? (
                <p className="sm:col-span-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? t("profile.saving") : t("profile.save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setForm(fromRow(row));
                    setEditing(false);
                    setError("");
                  }}
                  disabled={busy}
                >
                  {t("profile.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <section className="rounded-lg bg-cream p-3">
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted">{t("profile.patientInfo")}</h3>
                  <dl className="grid gap-1 text-sm">
                    <Item k={t("profile.father")} v={row.fatherOrHusbandName} />
                    <Item k={t("profile.mobile")} v={row.mobile} />
                    <Item k={t("profile.status")} v={tStatus(t, row.status)} />
                  </dl>
                </section>
                <section className="rounded-lg bg-cream p-3">
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted">{t("profile.location")}</h3>
                  <dl className="grid gap-1 text-sm">
                    <Item k={t("profile.village")} v={row.village} />
                    <Item k={t("profile.post")} v={row.post} />
                    <Item k={t("profile.nyaya")} v={row.nyayaPanchayat} />
                    <Item k={t("profile.block")} v={row.block} />
                    <Item k={t("profile.tehsil")} v={row.tehsil} />
                    <Item k={t("profile.district")} v={row.district} />
                  </dl>
                </section>
                <section className="rounded-lg bg-cream p-3 sm:col-span-2">
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted">{t("profile.registration")}</h3>
                  <dl className="grid gap-1 text-sm sm:grid-cols-2">
                    <Item k={t("profile.regNo")} v={row.registrationNumber} />
                    <Item k={t("profile.regDate")} v={formatWhen(row.createdAt, locale)} />
                    <Item k={t("profile.screeningDate")} v={row.screeningDate} />
                    <Item k={t("profile.surgeryDate")} v={row.surgeryDate} />
                    <Item k={t("profile.followUpDate")} v={row.followUpDate} />
                    <Item k={t("profile.followUpStatus")} v={tFollowUp(t, row.followUpStatus)} />
                  </dl>
                </section>
              </div>
              {row.note ? (
                <p className="mt-3 text-sm text-muted">
                  <span className="font-medium text-navy">{t("profile.note")}: </span>
                  {row.note}
                </p>
              ) : null}
              {row.followUpNotes ? (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-navy">{t("profile.followUpNotes")}: </span>
                  {row.followUpNotes}
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              {openPdf ? (
                <p className="mt-3 text-sm text-muted">
                  {t("profile.pdfReady")}{" "}
                  <a href={openPdf.url} target="_blank" className="font-semibold text-maroon hover:underline">
                    {t("profile.openPdf")}
                  </a>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setEditing(true)}>
                  {t("profile.edit")}
                </Button>
                <Button
                  variant="navy"
                  size="sm"
                  disabled={pdfBusy !== null}
                  onClick={() => void onDownload()}
                >
                  {pdfBusy === "download" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                  {t("profile.downloadSlip")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pdfBusy !== null}
                  onClick={() => void onPrint()}
                >
                  {pdfBusy === "print" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Printer className="size-4" aria-hidden="true" />
                  )}
                  {t("profile.print")}
                </Button>
                {canDelete ? (
                  <Button variant="danger" size="sm" onClick={() => onDelete?.(row)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t("profile.delete")}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Label className="mb-1">{label}</Label>
      {children}
    </div>
  );
}
