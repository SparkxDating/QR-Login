import { CAMP, PHOTOS } from "@/lib/camp";
import { drawSlip } from "@/lib/slip-layout";

const PAGE_W = 595;
const PAGE_H = 842;
const CANVAS_W = 1240;
const CANVAS_H = 1754;
const enc = new TextEncoder();

export function slipDetailsFromRow(row: {
  name: string;
  fatherOrHusbandName: string;
  village: string;
  post: string;
  nyayaPanchayat: string;
  block: string;
  tehsil: string;
  district: string;
  mobile: string;
}): Record<string, string> {
  return {
    नाम: row.name,
    "पिता/पति का नाम": row.fatherOrHusbandName,
    ग्राम: row.village,
    पोस्ट: row.post,
    "न्याय पंचायत": row.nyayaPanchayat,
    ब्लॉक: row.block,
    तहसील: row.tehsil,
    जनपद: row.district,
    मोबाइल: row.mobile,
  };
}

export type SlipSaveResult = {
  filename: string;
  needsOpenFallback: boolean;
  openedInBrowser: boolean;
  openUrl: string | null;
  revoke: () => void;
};

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function isIosWebKitNonSafari(): boolean {
  if (!isIosDevice()) return false;
  return /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(navigator.userAgent || "");
}

function closePreviewWindow(preview: Window | null | undefined) {
  if (!preview || preview.closed) return;
  try {
    preview.close();
  } catch {
    // Ignore a blocked close.
  }
}

const LOADING_HTML = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>PDF बन रहा है...</title>
<style>
  html,body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:"Noto Sans Devanagari",system-ui,sans-serif;background:#fff6ea;color:#1b2a4a}
</style>
</head>
<body><p>PDF बन रहा है...</p></body>
</html>`;

export function openPdfPreviewWindow(): Window | null {
  if (typeof window === "undefined" || !isIosDevice()) return null;
  let preview: Window | null = null;
  try {
    preview = window.open("about:blank", "_blank");
  } catch {
    preview = null;
  }
  if (!preview) return null;
  try {
    preview.document.open();
    preview.document.write(LOADING_HTML);
    preview.document.close();
    preview.stop?.();
  } catch {
    // Opener can still set location.href after generation.
  }
  return preview;
}

function escapeHtml(value: string): string {
  return value.replace(/[<>&"'`]/g, "");
}

function openPdfInPreview(preview: Window, url: string, filename: string): boolean {
  if (preview.closed) return false;
  try {
    preview.location.href = url;
    if (!preview.closed) return true;
  } catch {
    // Fall through to same-origin document navigation.
  }
  try {
    const title = escapeHtml(filename);
    const safeUrl = JSON.stringify(url);
    preview.document.open();
    preview.document.write(`<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
</head>
<body>
<p>PDF खुल रहा है...</p>
<script>
  try { location.href = ${safeUrl}; }
  catch (e) { location.replace(${safeUrl}); }
</script>
<p><a href="${escapeHtml(url)}">${title}</a></p>
</body>
</html>`);
    preview.document.close();
    return !preview.closed;
  } catch {
    return false;
  }
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:")) {
        resolve(reader.result);
        return;
      }
      reject(new Error("PDF नहीं बन सका।"));
    };
    reader.onerror = () => reject(new Error("PDF नहीं बन सका।"));
    reader.readAsDataURL(blob);
  });
}

function triggerAnchorDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function jpegToPdf(jpeg: Uint8Array, imgW: number, imgH: number): Uint8Array {
  const scale = Math.min(PAGE_W / imgW, PAGE_H / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (PAGE_W - drawW) / 2;
  const y = (PAGE_H - drawH) / 2;
  const content = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const contentBytes = enc.encode(content);

  const objects: Uint8Array[] = [
    enc.encode("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"),
    enc.encode("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"),
    enc.encode(
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >> endobj\n",
    ),
    concat([
      enc.encode(`4 0 obj << /Length ${contentBytes.length} >> stream\n`),
      contentBytes,
      enc.encode("endstream\nendobj\n"),
    ]),
    concat([
      enc.encode(
        `5 0 obj << /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >> stream\n`,
      ),
      jpeg,
      enc.encode("\nendstream\nendobj\n"),
    ]),
  ];

  const header = concat([enc.encode("%PDF-1.4\n%"), new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3, 0x0a])]);
  const offsets = [0];
  let pos = header.length;
  for (const obj of objects) {
    offsets.push(pos);
    pos += obj.length;
  }
  const xrefStart = pos;
  const xrefLines = ["xref\n", `0 ${objects.length + 1}\n`, "0000000000 65535 f \n"];
  for (let i = 1; i < offsets.length; i += 1) {
    xrefLines.push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  const xref = enc.encode(xrefLines.join(""));
  const trailer = enc.encode(
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  );
  return concat([header, ...objects, xref, trailer]);
}

async function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  await Promise.race([
    document.fonts.ready.catch(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 2500);
    }),
  ]);
}

export async function buildRegistrationPdf(
  registrationNumber: string,
  details: Record<string, string>,
): Promise<{ pdf: Uint8Array; filename: string; previewDataUrl: string }> {
  await waitForFonts();

  const [jagatguru, modi, yogi, bhola, logo] = await Promise.all([
    loadImage(PHOTOS.jagatguru.src),
    loadImage(PHOTOS.modi.src),
    loadImage(PHOTOS.yogi.src),
    loadImage(PHOTOS.bhola.src),
    loadImage(CAMP.logo.src),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF नहीं बन सका।");

  drawSlip(
    ctx,
    CANVAS_W,
    CANVAS_H,
    registrationNumber,
    details,
    [
      {
        img: jagatguru,
        name: PHOTOS.jagatguru.name,
        title: PHOTOS.jagatguru.title,
        cropY: 0.08,
      },
      {
        img: modi,
        name: PHOTOS.modi.name,
        title: PHOTOS.modi.title,
        cropY: 0.22,
      },
      {
        img: yogi,
        name: PHOTOS.yogi.name,
        title: PHOTOS.yogi.title,
        cropY: 0.18,
      },
    ],
    {
      img: bhola,
      name: PHOTOS.bhola.name,
      title: PHOTOS.bhola.title,
      cropY: 0.18,
    },
    logo,
  );

  const previewDataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const jpeg = await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("PDF नहीं बन सका।"));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      },
      "image/jpeg",
      0.9,
    );
  });

  return {
    pdf: jpegToPdf(jpeg, CANVAS_W, CANVAS_H),
    filename: `${registrationNumber}.pdf`,
    previewDataUrl,
  };
}

export async function saveRegistrationPdf(
  registrationNumber: string,
  details: Record<string, string>,
  previewWindow?: Window | null,
): Promise<SlipSaveResult> {
  try {
    const { pdf, filename } = await buildRegistrationPdf(registrationNumber, details);
    const bytes = new Uint8Array(pdf.byteLength);
    bytes.set(pdf);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const file = new File([blob], filename, { type: "application/pdf" });
    const url = URL.createObjectURL(file);
    const revoke = () => URL.revokeObjectURL(url);

    if (isIosDevice()) {
      let openUrl = url;
      if (isIosWebKitNonSafari()) {
        try {
          openUrl = await readBlobAsDataUrl(file);
        } catch {
          openUrl = url;
        }
      }
      const preview = previewWindow && !previewWindow.closed ? previewWindow : null;
      let openedInBrowser = false;
      if (preview) {
        openedInBrowser = openPdfInPreview(preview, openUrl, filename);
        if (!openedInBrowser) closePreviewWindow(preview);
      }
      if (openUrl !== url) window.setTimeout(revoke, 20_000);
      return {
        filename,
        needsOpenFallback: true,
        openedInBrowser,
        openUrl,
        revoke: openUrl === url ? revoke : () => undefined,
      };
    }

    closePreviewWindow(previewWindow);
    triggerAnchorDownload(url, filename);
    window.setTimeout(revoke, 20_000);
    return {
      filename,
      needsOpenFallback: false,
      openedInBrowser: false,
      openUrl: null,
      revoke: () => undefined,
    };
  } catch (error) {
    closePreviewWindow(previewWindow);
    throw error;
  }
}

export async function downloadRegistrationPdf(
  registrationNumber: string,
  details: Record<string, string>,
  previewWindow?: Window | null,
): Promise<SlipSaveResult> {
  return saveRegistrationPdf(registrationNumber, details, previewWindow);
}
