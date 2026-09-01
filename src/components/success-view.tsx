import { useState } from "react";
import { CAMP } from "@/lib/camp";
import { downloadRegistrationPdf } from "@/lib/registration-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, RotateCcw } from "lucide-react";

export function SuccessView({
  registrationNumber,
  details,
  onReset,
}: {
  registrationNumber: string;
  details: Record<string, string>;
  onReset: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  async function onDownload() {
    if (downloading) return;
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadRegistrationPdf(registrationNumber, details);
    } catch {
      setDownloadError("PDF डाउनलोड नहीं हो सका। कृपया पुनः प्रयास करें।");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="size-9" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-2xl text-navy">पंजीकरण सफल हुआ</h2>
      <p className="mt-2 text-muted">आपका पंजीकरण सफलतापूर्वक दर्ज कर लिया गया है।</p>
      <p className="mt-5 rounded-md bg-cream px-3 py-3 font-display text-xl text-maroon">
        पंजीकरण क्रमांक:{" "}
        <span className="tabular-nums tracking-wide">{registrationNumber}</span>
      </p>
      <p className="mt-3 font-display text-lg text-saffron">{CAMP.dateLine}</p>
      <p className="mt-3 text-sm text-success">{CAMP.operationNote}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="navy" onClick={() => void onDownload()} disabled={downloading}>
          <Download className="size-4" aria-hidden="true" />
          {downloading ? "PDF बन रहा है..." : "पंजीकरण PDF डाउनलोड करें"}
        </Button>
        <Button variant="secondary" onClick={onReset} disabled={downloading}>
          <RotateCcw className="size-4" aria-hidden="true" />
          नया पंजीकरण
        </Button>
      </div>
      {downloadError ? (
        <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {downloadError}
        </p>
      ) : null}
    </Card>
  );
}
