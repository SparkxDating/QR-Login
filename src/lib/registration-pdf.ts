import { encode } from "uqr";
import { CAMP, PHOTOS } from "@/lib/camp";

const PAGE_W = 595;
const PAGE_H = 842;
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
  const cell = size / qr.size;
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#1b2a4a";
  for (let row = 0; row < qr.size; row += 1) {
    for (let col = 0; col < qr.size; col += 1) {
      if (qr.data[row]?.[col]) {
        ctx.fillRect(x + col * cell, y + row * cell, cell + 0.4, cell + 0.4);
      }
    }
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
  const margin = 44;
  ctx.fillStyle = "#fff6ea";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, 0, width, 78);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(0, 78, width, 5);

  if (logo) {
    const side = 52;
    ctx.drawImage(logo, margin, 13, side, side);
  }
  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  ctx.font = '600 24px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.foundation, width / 2, 34);
  ctx.font = '500 18px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.hospital, width / 2, 60);

  let y = 108;
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 24px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  ctx.fillText(CAMP.inspiration, width / 2, y);

  const gap = 12;
  const cardW = (width - margin * 2 - gap * 2) / 3;
  const cardX0 = margin;
  const cardY = y + 12;
  const radius = 62;
  const nameFont = '700 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const titleFont = '500 13px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const nameLine = 20;
  const titleLine = 17;
  const measures = portraits.map((person) => {
    ctx.font = nameFont;
    const nameLines = wrapText(ctx, person.name, cardW - 20);
    ctx.font = titleFont;
    const titleLines = wrapText(ctx, person.title, cardW - 20);
    const h =
      12 + radius * 2 + 10 + nameLines.length * nameLine + 4 + titleLines.length * titleLine + 12;
    return { nameLines, titleLines, h };
  });
  const cardH = Math.max(...measures.map((m) => m.h));

  portraits.forEach((person, i) => {
    const measure = measures[i];
    if (!measure) return;
    const x = cardX0 + i * (cardW + gap);
    ctx.fillStyle = "#fffdf8";
    fillRoundRect(ctx, x, cardY, cardW, cardH, 16);
    ctx.strokeStyle = "#c4a35a";
    ctx.lineWidth = 1.5;
    strokeRoundRect(ctx, x, cardY, cardW, cardH, 16);
    const cx = x + cardW / 2;
    const cy = cardY + 12 + radius;
    drawCoverCircle(ctx, person.img, cx, cy, radius, person.cropY);
    ctx.textAlign = "center";
    ctx.fillStyle = "#7a1f1a";
    ctx.font = nameFont;
    let ty = cy + radius + 24;
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
  });

  y = cardY + cardH + 16;
  ctx.font = '400 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const orgR = 38;
  const orgCx = margin + 22 + orgR;
  const textX = orgCx + orgR + 22;
  const textW = width - margin - 16 - textX;
  const honorLines = wrapText(ctx, CAMP.organizerHonor, textW);
  const orgH = Math.max(96, 28 + honorLines.length * 18 + 28);
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, y, width - margin * 2, orgH, 16);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, margin, y, width - margin * 2, orgH, 16);
  const orgCy = y + orgH / 2;
  drawCoverCircle(ctx, organizer.img, orgCx, orgCy, orgR, organizer.cropY);
  ctx.textAlign = "left";
  ctx.fillStyle = "#c4a35a";
  ctx.font = '600 15px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.organizerRole, textX, orgCy - 22);
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 22px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  ctx.fillText(CAMP.organizer, textX, orgCy + 4);
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '400 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let honorY = orgCy + 24;
  for (const line of honorLines) {
    ctx.fillText(line, textX, honorY);
    honorY += 18;
  }

  y += orgH + 18;
  const qrSize = 118;
  const qrX = width - margin - qrSize;
  ctx.textAlign = "left";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '700 24px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  const titleMax = qrX - margin - 18;
  let titleY = y + 8;
  for (const line of wrapText(ctx, CAMP.formTitle, titleMax)) {
    ctx.fillText(line, margin, titleY);
    titleY += 30;
  }
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 28px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(`पंजीकरण क्रमांक: ${registrationNumber}`, margin, titleY + 8);
  ctx.fillStyle = "#c45308";
  ctx.font = '700 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let dateY = titleY + 36;
  for (const line of wrapText(ctx, CAMP.dateLine, titleMax)) {
    ctx.fillText(line, margin, dateY);
    dateY += 22;
  }

  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, qrX - 8, y - 6, qrSize + 16, qrSize + 34, 12);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, qrX - 8, y - 6, qrSize + 16, qrSize + 34, 12);
  drawQr(ctx, registrationNumber, qrX, y, qrSize);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '600 12px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText("पंजीकरण QR", qrX + qrSize / 2, y + qrSize + 16);

  y = Math.max(dateY, y + qrSize + 36) + 10;
  const boxW = width - margin * 2;
  ctx.textAlign = "left";
  ctx.font = '500 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const [label, value] of Object.entries(details)) {
    const valueX = margin + 250;
    const valueMax = boxW - 262;
    const valueLines = wrapText(ctx, value, valueMax);
    const rowH = Math.max(34, 10 + valueLines.length * 20);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(margin, y - 22, boxW, rowH);
    ctx.strokeStyle = "#ead9c8";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin, y - 22, boxW, rowH);
    ctx.fillStyle = "#7a1f1a";
    ctx.fillText(label, margin + 12, y);
    ctx.fillStyle = "#1a1510";
    valueLines.forEach((line, i) => {
      ctx.fillText(line, valueX, y + i * 20);
    });
    y += rowH;
  }

  y += 14;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1f7a4d";
  ctx.font = '700 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.operationNote, boxW)) {
    ctx.fillText(line, width / 2, y);
    y += 22;
  }
  ctx.fillStyle = "#6b5e52";
  ctx.font = '400 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.address, boxW)) {
    ctx.fillText(line, width / 2, y);
    y += 18;
  }

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, height - 48, width, 48);
  ctx.fillStyle = "#fffdf8";
  ctx.font = '600 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.freeNote, width / 2, height - 18);
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

export async function downloadRegistrationPdf(
  registrationNumber: string,
  details: Record<string, string>,
): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready.catch(() => undefined);
  }

  const [jagatguru, modi, yogi, bhola, logo] = await Promise.all([
    loadImage(PHOTOS.jagatguru.src),
    loadImage(PHOTOS.modi.src),
    loadImage(PHOTOS.yogi.src),
    loadImage(PHOTOS.bhola.src),
    loadImage(CAMP.logo.src),
  ]);

  const width = 1240;
  const height = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("pdf");

  drawSlip(
    ctx,
    width,
    height,
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

  const jpeg = await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("pdf"));
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

  const pdf = jpegToPdf(jpeg, width, height);
  const bytes = Uint8Array.from(pdf);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${registrationNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
