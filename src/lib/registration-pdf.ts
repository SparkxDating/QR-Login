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
