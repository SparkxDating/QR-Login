import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BLOCKS,
  FOLLOW_UP_STATUSES,
  OTHER_STATUSES,
  WORKFLOW_STATUSES,
  followUpStatusLabel,
  statusLabel,
  type FollowUpStatus,
  type RegistrationStatus,
} from "@/lib/camp";
import { duplicateLabel, type RegistrationRow } from "@/lib/registrations";
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
import { Download, LoaderCircle, Printer, Trash2, X } from "lucide-react";

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
      setError(err instanceof Error ? err.message : "सहेजा नहीं जा सका।");
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
      setError("स्लिप PDF नहीं बन सका। कृपया पुनः प्रयास करें।");
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
      setError("प्रिंट नहीं हो सका। कृपया पुनः प्रयास करें।");
    } finally {
      setPdfBusy(null);
    }
  }

  const warning = duplicateLabel(row.duplicate);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[96dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-cream shadow-[var(--shadow-lift)] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-paper px-4 py-3">
          <div className="min-w-0">
            <p className="tabular-nums text-sm font-semibold text-maroon">{row.registrationNumber}</p>
            <h2 id="patient-profile-title" className="font-display text-xl text-navy">
              {row.name}
            </h2>
            <p className="text-sm text-muted">{statusLabel(row.status)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} aria-label="बंद करें">
            <X className="size-4" aria-hidden="true" />
            बंद करें
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
              <Field label="नाम">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label="पिता/पति का नाम">
                <Input
                  value={form.fatherOrHusbandName}
                  onChange={(e) => set("fatherOrHusbandName", e.target.value)}
                  required
                />
              </Field>
              <Field label="ग्राम">
                <Input value={form.village} onChange={(e) => set("village", e.target.value)} required />
              </Field>
              <Field label="पोस्ट">
                <Input value={form.post} onChange={(e) => set("post", e.target.value)} required />
              </Field>
              <Field label="न्याय पंचायत">
                <Input
                  value={form.nyayaPanchayat}
                  onChange={(e) => set("nyayaPanchayat", e.target.value)}
                  required
                />
              </Field>
              <Field label="ब्लॉक">
                <NativeSelect value={form.block} onChange={(e) => set("block", e.target.value)} required>
                  {BLOCKS.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="तहसील">
                <Input value={form.tehsil} onChange={(e) => set("tehsil", e.target.value)} required />
              </Field>
              <Field label="जनपद">
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} required />
              </Field>
              <Field label="मोबाइल">
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </Field>
              <Field label="स्थिति">
                <NativeSelect
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as RegistrationStatus)}
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
              </Field>
              <Field label="नोट" wide>
                <Textarea value={form.note} onChange={(e) => set("note", e.target.value)} maxLength={500} />
              </Field>

              <h3 className="sm:col-span-2 mt-2 font-display text-lg text-navy">फॉलो-अप</h3>
              <Field label="जाँच तिथि">
                <Input
                  type="date"
                  value={form.screeningDate}
                  onChange={(e) => set("screeningDate", e.target.value)}
                />
              </Field>
              <Field label="ऑपरेशन तिथि">
                <Input
                  type="date"
                  value={form.surgeryDate}
                  onChange={(e) => set("surgeryDate", e.target.value)}
                />
              </Field>
              <Field label="फॉलो-अप तिथि">
                <Input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => set("followUpDate", e.target.value)}
                />
              </Field>
              <Field label="फॉलो-अप स्थिति">
                <NativeSelect
                  value={form.followUpStatus}
                  onChange={(e) => set("followUpStatus", e.target.value as FormState["followUpStatus"])}
                >
                  <option value="">—</option>
                  {FOLLOW_UP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="फॉलो-अप नोट" wide>
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
                  {busy ? "सहेजा जा रहा है…" : "सहेजें"}
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
                  रद्द करें
                </Button>
              </div>
            </form>
          ) : (
            <>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <Item k="पिता/पति" v={row.fatherOrHusbandName} />
                <Item k="मोबाइल" v={row.mobile} />
                <Item k="ग्राम" v={row.village} />
                <Item k="पोस्ट" v={row.post} />
                <Item k="न्याय पंचायत" v={row.nyayaPanchayat} />
                <Item k="ब्लॉक" v={row.block} />
                <Item k="तहसील" v={row.tehsil} />
                <Item k="जनपद" v={row.district} />
                <Item k="पंजीकरण तिथि" v={formatWhen(row.createdAt)} />
                <Item k="स्थिति" v={statusLabel(row.status)} />
                <Item k="जाँच तिथि" v={row.screeningDate} />
                <Item k="ऑपरेशन तिथि" v={row.surgeryDate} />
                <Item k="फॉलो-अप तिथि" v={row.followUpDate} />
                <Item k="फॉलो-अप स्थिति" v={followUpStatusLabel(row.followUpStatus)} />
              </dl>
              {row.note ? (
                <p className="mt-3 text-sm text-muted">
                  <span className="font-medium text-navy">नोट: </span>
                  {row.note}
                </p>
              ) : null}
              {row.followUpNotes ? (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-navy">फॉलो-अप नोट: </span>
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
                  PDF तैयार है।{" "}
                  <a href={openPdf.url} target="_blank" className="font-semibold text-maroon hover:underline">
                    PDF खोलें / सेव करें
                  </a>
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setEditing(true)}>
                  संपादित करें
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
                  स्लिप डाउनलोड
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
                  प्रिंट
                </Button>
                {canDelete ? (
                  <Button variant="danger" size="sm" onClick={() => onDelete?.(row)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    पंजीकरण हटाएँ
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
