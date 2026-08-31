import { CAMP } from "@/lib/camp";
import { escapeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, RotateCcw } from "lucide-react";

function downloadHtml(registrationNumber: string, details: Record<string, string>) {
  const rows = Object.entries(details)
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:8px 10px;background:#fff8f0;border-bottom:1px solid #ead9c8">${escapeHtml(k)}</th><td style="padding:8px 10px;border-bottom:1px solid #ead9c8">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(registrationNumber)} \u2014 \u092a\u0902\u091c\u0940\u0915\u0930\u0923</title>
<style>
  body{font-family:"Noto Sans Devanagari",system-ui,sans-serif;background:#fff8f0;color:#1a1510;margin:0;padding:24px}
  .card{max-width:560px;margin:0 auto;background:#fffdf9;border-radius:20px;padding:28px;box-shadow:0 8px 24px -12px rgb(107 29 29 / .2)}
  h1{font-size:22px;margin:0 0 8px}
  .num{font-size:28px;letter-spacing:.04em;color:#6b1d1d;margin:12px 0 20px}
  table{width:100%;border-collapse:collapse;font-size:15px}
  .note{margin-top:18px;color:#1f7a4d;font-weight:600}
</style>
</head>
<body>
<div class="card">
  <p>${escapeHtml(CAMP.foundation)}</p>
  <h1>\u0928\u093f\u0903\u0936\u0941\u0932\u094d\u0915 \u092e\u094b\u0924\u093f\u092f\u093e\u092c\u093f\u0902\u0926 \u0936\u093f\u0935\u093f\u0930 \u092a\u0902\u091c\u0940\u0915\u0930\u0923</h1>
  <p class="num">\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u094d\u0930\u092e\u093e\u0902\u0915: ${escapeHtml(registrationNumber)}</p>
  <table>${rows}</table>
  <p class="note">${escapeHtml(CAMP.operationNote)}</p>
  <p style="margin-top:12px;font-size:13px;color:#6b5e52">${escapeHtml(CAMP.address)}</p>
</div>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${registrationNumber}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SuccessView({
  registrationNumber,
  details,
  onReset,
}: {
  registrationNumber: string;
  details: Record<string, string>;
  onReset: () => void;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="size-9" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-2xl text-navy">\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0938\u092b\u0932 \u0939\u0941\u0906</h2>
      <p className="mt-2 text-muted">\u0906\u092a\u0915\u093e \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0938\u092b\u0932\u0924\u093e\u092a\u0942\u0930\u094d\u0935\u0915 \u0926\u0930\u094d\u091c \u0915\u0930 \u0932\u093f\u092f\u093e \u0917\u092f\u093e \u0939\u0948\u0964</p>
      <p className="mt-5 rounded-md bg-cream px-3 py-3 font-display text-xl text-maroon">
        \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u094d\u0930\u092e\u093e\u0902\u0915:{" "}
        <span className="tabular-nums tracking-wide">{registrationNumber}</span>
      </p>
      <p className="mt-3 text-sm text-success">{CAMP.operationNote}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          variant="navy"
          onClick={() => downloadHtml(registrationNumber, details)}
        >
          <Download className="size-4" aria-hidden="true" />
          \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u0940 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0921\u093e\u0909\u0928\u0932\u094b\u0921 \u0915\u0930\u0947\u0902
        </Button>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          \u0928\u092f\u093e \u092a\u0902\u091c\u0940\u0915\u0930\u0923
        </Button>
      </div>
    </Card>
  );
}
