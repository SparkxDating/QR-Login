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

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

async function trySharePdf(file: File): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  if (typeof nav.share !== "function") return false;
  try {
    if (typeof nav.canShare === "function" && !nav.canShare({ files: [file] })) {
      return false;
    }
    await nav.share({ files: [file], title: file.name });
    return true;
  } catch {
    return false;
  }
}

function drawSlip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  registrationNumber: string,
  details: Record<string, string>,
  portraits: SlipPhoto[],
  organizer: SlipPhoto,
  logo: HTMLImageElement | null,
) {
  const margin = 42;
  const headerH = 90;
  const goldH = 6;
  const footerH = 56;
  const innerW = width - margin * 2;
  const font = (weight: number, size: number, serif = false) =>
    `${weight} ${size}px ${serif ? '"Tiro Devanagari Hindi", "Noto Serif Devanagari", serif' : '"Noto Sans Devanagari", "Noto Sans", sans-serif'}`;

  ctx.fillStyle = "#fff6ea";
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, 0, width, headerH);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(0, headerH, width, goldH);

  const logoSize = 62;
  if (logo) ctx.drawImage(logo, margin, (headerH - logoSize) / 2, logoSize, logoSize);
  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  ctx.font = font(600, 26);
  ctx.fillText(CAMP.foundation, width / 2, 38);
  ctx.font = font(500, 18);
  ctx.fillText(CAMP.hospital, width / 2, 68);

  const bodyTop = headerH + goldH;
  const bodyBottom = height - footerH;
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, bodyTop + 8, width - 36, bodyBottom - bodyTop - 16);
  ctx.strokeStyle = "#7a1f1a";
  ctx.lineWidth = 1;
  ctx.strokeRect(22, bodyTop + 12, width - 44, bodyBottom - bodyTop - 24);

  const gap = 12;
  const cardGap = 16;
  const cardW = (innerW - cardGap * 2) / 3;
  const radius = 70;
  const photoTop = 12;
  const captionGap = 20;
  const nameFont = font(700, 21);
  const titleFont = font(500, 16);
  const nameLine = 26;
  const titleLine = 20;
  const measures = portraits.map((person) => {
    ctx.font = nameFont;
    const nameLines = wrapText(ctx, person.name, cardW - 24);
    ctx.font = titleFont;
    const titleLines = wrapText(ctx, person.title, cardW - 24);
    const h =
      photoTop +
      radius * 2 +
      captionGap +
      nameLines.length * nameLine +
      4 +
      titleLines.length * titleLine +
      12;
    return { nameLines, titleLines, h };
  });
  const cardH = Math.max(...measures.map((m) => m.h));

  ctx.font = font(400, 16);
  const orgR = 50;
  const orgTextX = margin + 18 + orgR * 2 + 18;
  const orgTextW = width - margin - 16 - orgTextX;
  const honorLines = wrapText(ctx, CAMP.organizerHonor, orgTextW);
  const orgH = Math.max(orgR * 2 + 28, 22 + 28 + honorLines.length * 20 + 22);

  const qrSize = 186;
  const qrBox = 214;
  const qrLabelH = 28;
  const qrBlockH = qrBox + qrLabelH;
  const leftW = width - margin - qrBox - 16 - margin;

  ctx.font = font(700, 22, true);
  const formTitleLines = wrapText(ctx, CAMP.formTitle, leftW);
  ctx.font = font(700, 16);
  const dateLines = wrapText(ctx, CAMP.dateLine, leftW);
  const numH = 84;
  const identH = Math.max(
    qrBlockH,
    8 + formTitleLines.length * 28 + 10 + numH + 12 + dateLines.length * 22,
  );

  const boxW = innerW;
  const labelW = 250;
  const valueMax = boxW - labelW - 20;
  const detailRows = Object.entries(details).map(([label, value]) => {
    ctx.font = font(700, 20);
    const valueLines = wrapText(ctx, value, valueMax);
    const rowH = Math.max(40, 14 + valueLines.length * 24);
    return { label, value, valueLines, rowH };
  });
  const detailsH = detailRows.reduce((n, row) => n + row.rowH, 0);

  ctx.font = font(700, 18);
  const opLines = wrapText(ctx, CAMP.operationNote, boxW - 48);
  ctx.font = font(700, 16);
  const freeLines = wrapText(ctx, CAMP.freeNote, boxW - 40);
  ctx.font = font(600, 16);
  const docHeadLines = wrapText(ctx, CAMP.documentsHeading, boxW - 40);
  ctx.font = font(500, 16);
  const docItemLines = DOCUMENTS.map((doc, i) => wrapText(ctx, `${i + 1}. ${doc}`, boxW - 40));
  ctx.font = font(600, 15);
  const hospitalLines = wrapText(ctx, `हॉस्पिटल पता: ${CAMP.hospital}`, boxW - 40);
  ctx.font = font(400, 15);
  const addressLines = wrapText(ctx, CAMP.address, boxW - 40);

  const bannerH = Math.max(44, 16 + opLines.length * 22);
  const instrContentH =
    14 +
    bannerH +
    10 +
    freeLines.length * 22 +
    10 +
    docHeadLines.length * 20 +
    6 +
    docItemLines.reduce((n, lines) => n + lines.length * 22, 0) +
    10 +
    hospitalLines.length * 20 +
    addressLines.length * 20 +
    14;

  const headingH = 36;
  const usedMin =
    bodyTop + 16 + headingH + cardH + orgH + identH + detailsH + instrContentH + gap * 4 + 10;
  let leftover = Math.max(0, bodyBottom - 10 - usedMin);
  const gapBoost = Math.min(10, leftover / 4);
  const sectionGap = gap + gapBoost;
  leftover -= gapBoost * 4;
  const rowBoost = Math.min(8, leftover / Math.max(1, detailRows.length));
  leftover -= rowBoost * detailRows.length;
  for (const row of detailRows) {
    row.rowH += rowBoost;
  }
  const instrSlack = leftover;

  let y = bodyTop + 16;

  ctx.fillStyle = "#7a1f1a";
  ctx.textAlign = "center";
  ctx.font = font(700, 24, true);
  ctx.fillText(CAMP.inspiration, width / 2, y + 22);
  ctx.fillStyle = "#c4a35a";
  ctx.beginPath();
  ctx.moveTo(width / 2 - 170, y + 8);
  ctx.lineTo(width / 2 - 92, y + 8);
  ctx.moveTo(width / 2 + 92, y + 8);
  ctx.lineTo(width / 2 + 170, y + 8);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#c4a35a";
  ctx.stroke();
  ctx.save();
  ctx.translate(width / 2 - 82, y + 8);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.save();
  ctx.translate(width / 2 + 82, y + 8);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  y += 36;

  const cardY = y;
  portraits.forEach((person, i) => {
    const measure = measures[i];
    if (!measure) return;
    const x = margin + i * (cardW + cardGap);
    ctx.fillStyle = "#fffdf8";
    fillRoundRect(ctx, x, cardY, cardW, cardH, 16);
    ctx.strokeStyle = "#c4a35a";
    ctx.lineWidth = 1.6;
    strokeRoundRect(ctx, x, cardY, cardW, cardH, 16);
    const cx = x + cardW / 2;
    const cy = cardY + photoTop + radius;
    drawCoverCircle(ctx, person.img, cx, cy, radius, person.cropY);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#7a1f1a";
    ctx.font = nameFont;
    let ty = cardY + photoTop + radius * 2 + captionGap;
    for (const line of measure.nameLines) {
      ctx.fillText(line, cx, ty);
      ty += nameLine;
    }
    ctx.fillStyle = "#1b2a4a";
    ctx.font = titleFont;
    ty += 2;
    for (const line of measure.titleLines) {
      ctx.fillText(line, cx, ty);
      ty += titleLine;
    }
    ctx.textBaseline = "alphabetic";
  });

  y = cardY + cardH + sectionGap;
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, y, innerW, orgH, 16);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.6;
  strokeRoundRect(ctx, margin, y, innerW, orgH, 16);
  const orgCx = margin + 18 + orgR;
  const orgCy = y + orgH / 2;
  drawCoverCircle(ctx, organizer.img, orgCx, orgCy, orgR, organizer.cropY);
  ctx.textAlign = "left";
  ctx.fillStyle = "#c4a35a";
  ctx.font = font(600, 16);
  ctx.fillText(CAMP.organizerRole, orgTextX, orgCy - 24);
  ctx.fillStyle = "#7a1f1a";
  ctx.font = font(700, 24, true);
  ctx.fillText(CAMP.organizer, orgTextX, orgCy + 6);
  ctx.fillStyle = "#1b2a4a";
  ctx.font = font(400, 16);
  let honorY = orgCy + 28;
  for (const line of honorLines) {
    ctx.fillText(line, orgTextX, honorY);
    honorY += 20;
  }

  y += orgH + sectionGap;
  const identY = y;
  const qrBoxX = width - margin - qrBox;

  ctx.textAlign = "left";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = font(700, 22, true);
  let titleY = identY + 22;
  for (const line of formTitleLines) {
    ctx.fillText(line, margin, titleY);
    titleY += 28;
  }

  const numY = titleY + 8;
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, numY, leftW, numH, 12);
  ctx.strokeStyle = "#7a1f1a";
  ctx.lineWidth = 2.8;
  strokeRoundRect(ctx, margin, numY, leftW, numH, 12);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.6;
  strokeRoundRect(ctx, margin + 5, numY + 5, leftW - 10, numH - 10, 8);
  ctx.fillStyle = "#7a1f1a";
  ctx.font = font(600, 16);
  ctx.fillText("पंजीकरण क्रमांक", margin + 18, numY + 28);
  ctx.font = font(700, 36);
  ctx.fillText(registrationNumber, margin + 18, numY + 68);

  ctx.fillStyle = "#c45308";
  ctx.font = font(700, 17);
  let dateY = numY + numH + 22;
  for (const line of dateLines) {
    ctx.fillText(line, margin, dateY);
    dateY += 22;
  }

  ctx.fillStyle = "#ffffff";
  fillRoundRect(ctx, qrBoxX, identY, qrBox, qrBlockH, 16);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 2.2;
  strokeRoundRect(ctx, qrBoxX, identY, qrBox, qrBlockH, 16);
  const qrInner = (qrBox - qrSize) / 2;
  drawQr(ctx, registrationNumber, qrBoxX + qrInner, identY + 12, qrSize);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = font(600, 14);
  ctx.fillText("पंजीकरण QR", qrBoxX + qrBox / 2, identY + qrBox + 18);

  y = identY + identH + sectionGap;
  ctx.textAlign = "left";
  const valueX = margin + labelW;
  detailRows.forEach((row, index) => {
    const { rowH, valueLines, label } = row;
    ctx.fillStyle = index % 2 === 0 ? "#fffdf8" : "#fff6ea";
    ctx.fillRect(margin, y, boxW, rowH);
    ctx.strokeStyle = "#c4a35a";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin, y, boxW, rowH);
    ctx.beginPath();
    ctx.moveTo(valueX - 10, y + 8);
    ctx.lineTo(valueX - 10, y + rowH - 8);
    ctx.strokeStyle = "#ead9c8";
    ctx.stroke();
    const textY = y + (rowH + 14) / 2 - ((valueLines.length - 1) * 24) / 2;
    ctx.fillStyle = "#7a1f1a";
    ctx.font = font(600, 17);
    ctx.fillText(label, margin + 14, textY);
    ctx.fillStyle = "#1b2a4a";
    ctx.font = font(700, 20);
    valueLines.forEach((line, i) => {
      ctx.fillText(line, valueX, textY + i * 24);
    });
    y += rowH;
  });

  y += sectionGap;
  const instrH = instrContentH + instrSlack;
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, y, boxW, instrH, 16);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.6;
  strokeRoundRect(ctx, margin, y, boxW, instrH, 16);

  const pad = 14 + instrSlack / 5;
  const innerGap = 10 + instrSlack / 5;

  ctx.fillStyle = "#1f7a4d";
  fillRoundRect(ctx, margin + 12, y + pad, boxW - 24, bannerH, 10);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fffdf8";
  ctx.font = font(700, 18);
  const opY = y + pad + (bannerH + 14) / 2 - ((opLines.length - 1) * 22) / 2;
  opLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, opY + i * 22);
  });

  let iy = y + pad + bannerH + innerGap;
  ctx.fillStyle = "#7a1f1a";
  ctx.font = font(700, 17);
  for (const line of freeLines) {
    ctx.fillText(line, width / 2, iy + 16);
    iy += 22;
  }

  iy += innerGap;
  ctx.textAlign = "left";
  ctx.fillStyle = "#7a1f1a";
  ctx.font = font(600, 16);
  for (const line of docHeadLines) {
    ctx.fillText(line, margin + 20, iy + 16);
    iy += 20;
  }
  iy += 6;
  ctx.fillStyle = "#1a1510";
  ctx.font = font(500, 16);
  docItemLines.forEach((lines) => {
    lines.forEach((line) => {
      ctx.fillText(line, margin + 20, iy + 16);
      iy += 22;
    });
  });

  iy += innerGap;
  ctx.fillStyle = "#1b2a4a";
  ctx.font = font(600, 15);
  for (const line of hospitalLines) {
    ctx.fillText(line, margin + 20, iy + 14);
    iy += 20;
  }
  ctx.font = font(400, 15);
  ctx.fillStyle = "#6b5e52";
  for (const line of addressLines) {
    ctx.fillText(line, margin + 20, iy + 14);
    iy += 20;
  }

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, height - footerH, width, footerH);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(0, height - footerH, width, 4);
  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  ctx.font = font(600, 17);
  ctx.fillText(CAMP.freeNote, width / 2, height - 20);
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

  const header = enc.encode("%PDF-1.4\n");
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
): Promise<SlipSaveResult> {
  const { pdf, filename } = await buildRegistrationPdf(registrationNumber, details);
  const bytes = new Uint8Array(pdf.byteLength);
  bytes.set(pdf);
  const blob = new Blob([bytes], { type: "application/pdf" });

  if (isIosDevice()) {
    const file = new File([blob], filename, { type: "application/pdf" });
    const shared = await trySharePdf(file);
    if (shared) {
      return { filename, needsOpenFallback: false, openUrl: null, revoke: () => undefined };
    }
    const url = URL.createObjectURL(blob);
    return {
      filename,
      needsOpenFallback: true,
      openUrl: url,
      revoke: () => URL.revokeObjectURL(url),
    };
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 20_000);
  return { filename, needsOpenFallback: false, openUrl: null, revoke: () => undefined };
}

export async function downloadRegistrationPdf(
  registrationNumber: string,
  details: Record<string, string>,
): Promise<SlipSaveResult> {
  return saveRegistrationPdf(registrationNumber, details);
}
