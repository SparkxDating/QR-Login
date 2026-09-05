import { type RegistrationRow } from "@/lib/registrations";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export function AdminDeleteDialog({
  row,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  row: RegistrationRow;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-lift)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 bg-danger" aria-hidden="true" />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="delete-title" className="font-display text-xl text-navy">
                पंजीकरण स्थायी रूप से हटाएँ?
              </h2>
              <p className="mt-1 text-sm text-muted">यह क्रिया वापस नहीं ली जा सकती।</p>
            </div>
          </div>
          <dl className="mt-4 space-y-1 rounded-lg bg-cream px-3 py-2.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">पंजीकरण संख्या:</dt>
              <dd className="tabular-nums font-semibold text-maroon">{row.registrationNumber}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">नाम:</dt>
              <dd className="font-medium text-navy">{row.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">मोबाइल:</dt>
              <dd className="tabular-nums text-navy">{row.mobile}</dd>
            </div>
          </dl>
          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
              रद्द करें
            </Button>
            <Button variant="danger" size="sm" onClick={onConfirm} disabled={busy}>
              {busy ? "हटाया जा रहा है…" : "हाँ, हटाएँ"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
