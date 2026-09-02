import { encode } from "uqr";
import { CAMP, DOCUMENTS, PHOTOS } from "@/lib/camp";

const PAGE_W = 595;
const PAGE_H = 842;
const CANVAS_W = 1240;
const CANVAS_H = 1754;
const enc = new TextEncoder();

type SlipPhoto = {
  img: HTMLImageElement | null;
  name: string;
  title: string;
  cropY: number;
};

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const pushFitted = (chunk: string) => {
    if (ctx.measureText(chunk).width <= maxWidth) {
      lines.push(chunk);
      return;
    }
    let current = "";
    for (const ch of chunk) {
      const next = current + ch;
      if (current && ctx.measureText(next).width > maxWidth) {
        lines.push(current);
        current = ch;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  };
  const paragraphs = text.split(/\n+/);
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let current = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const next = `${current} ${words[i]}`;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
        continue;
      }
      pushFitted(current);
      current = words[i];
    }
    if (current) pushFitted(current);
  }
  return lines.length > 0 ? lines : [text];
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.stroke();
}

function drawCoverCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  radius: number,
  cropY: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = "#fff6ea";
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  if (img) {
    const size = radius * 2;
    const scale = Math.max(size / img.width, size / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const extra = dh - size;
    ctx.drawImage(img, cx - dw / 2, cy - radius - extra * cropY, dw, dh);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff6ea";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 3.5;
  ctx.stroke();
}

function drawQr(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
) {
  const qr = encode(value, { ecc: "M", border: 2 });
  const pad = Math.round(size * 0.1);
  const inner = size - pad * 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  const cell = inner / qr.size;
  ctx.fillStyle = "#1b2a4a";
  for (let row = 0; row < qr.size; row += 1) {
    for (let col = 0; col < qr.size; col += 1) {
      if (qr.data[row]?.[col]) {
        ctx.fillRect(x + pad + col * cell, y + pad + row * cell, cell + 0.4, cell + 0.4);
      }
    }
  }
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function closePreviewWindow(preview: Window | null | undefined) {
  if (!preview || preview.closed) return;
  try {
    preview.close();
  } catch {
    // Ignore a blocked close.
  }
}

export function openPdfPreviewWindow(): Window | null {
  if (typeof window === "undefined" || !isIosDevice()) return null;
  const preview = window.open("", "_blank");
  if (!preview) return null;
  try {
    preview.document.open();
    preview.document.write("<!DOCTYPE html><html lang=\"hi\"><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/><title>PDF</title></head><body><p>PDF बन रहा है...</p></body></html>");
    preview.document.close();
  } catch {
    // The window handle is still usable for location.replace after generation.
  }
  return preview;
}

function openPdfInPreview(preview: Window, url: string): boolean {
  try {
    preview.location.replace(url);
    return !preview.closed;
  } catch {
    return false;
  }
}

function triggerAnchorDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
