import { encode } from "uqr";
import { CAMP, DOCUMENTS, PHOTOS } from "@/lib/camp";

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
  const pad = Math.round(size * 0.12);
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
  const margin = 40;
  const footerH = 52;
  ctx.fillStyle = "#fff6ea";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, 0, width, 74);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(0, 74, width, 5);

  if (logo) ctx.drawImage(logo, margin, 11, 50, 50);
  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  ctx.font = '600 23px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.foundation, width / 2, 32);
  ctx.font = '500 17px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.hospital, width / 2, 56);

  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 22px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  ctx.fillText(CAMP.inspiration, width / 2, 104);

  const gap = 12;
  const cardW = (width - margin * 2 - gap * 2) / 3;
  const cardX0 = margin;
  const cardY = 114;
  const radius = 58;
  const nameFont = '700 17px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const titleFont = '500 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const nameLine = 21;
  const titleLine = 18;
  const measures = portraits.map((person) => {
    ctx.font = nameFont;
    const nameLines = wrapText(ctx, person.name, cardW - 18);
    ctx.font = titleFont;
    const titleLines = wrapText(ctx, person.title, cardW - 18);
    const h =
      10 + radius * 2 + 10 + nameLines.length * nameLine + 4 + titleLines.length * titleLine + 12;
    return { nameLines, titleLines, h };
  });
  const cardH = Math.max(...measures.map((m) => m.h));

  portraits.forEach((person, i) => {
    const measure = measures[i];
    if (!measure) return;
    const x = cardX0 + i * (cardW + gap);
    ctx.fillStyle = "#fffdf8";
    fillRoundRect(ctx, x, cardY, cardW, cardH, 14);
    ctx.strokeStyle = "#c4a35a";
    ctx.lineWidth = 1.5;
    strokeRoundRect(ctx, x, cardY, cardW, cardH, 14);
    const cx = x + cardW / 2;
    const cy = cardY + 10 + radius;
    drawCoverCircle(ctx, person.img, cx, cy, radius, person.cropY);
    ctx.textAlign = "center";
    ctx.fillStyle = "#7a1f1a";
    ctx.font = nameFont;
    let ty = cy + radius + 22;
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

  let y = cardY + cardH + 12;
  ctx.font = '400 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const orgR = 36;
  const orgCx = margin + 20 + orgR;
  const orgTextX = orgCx + orgR + 20;
  const orgTextW = width - margin - 14 - orgTextX;
  const honorLines = wrapText(ctx, CAMP.organizerHonor, orgTextW);
  const orgH = Math.max(92, 24 + honorLines.length * 18 + 28);
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, y, width - margin * 2, orgH, 14);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, margin, y, width - margin * 2, orgH, 14);
  const orgCy = y + orgH / 2;
  drawCoverCircle(ctx, organizer.img, orgCx, orgCy, orgR, organizer.cropY);
  ctx.textAlign = "left";
  ctx.fillStyle = "#c4a35a";
  ctx.font = '600 15px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.organizerRole, orgTextX, orgCy - 20);
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 21px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  ctx.fillText(CAMP.organizer, orgTextX, orgCy + 5);
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '400 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let honorY = orgCy + 24;
  for (const line of honorLines) {
    ctx.fillText(line, orgTextX, honorY);
    honorY += 18;
  }

  y += orgH + 14;
  const qrSize = 148;
  const qrBox = 176;
  const qrBoxX = width - margin - qrBox;
  const leftW = qrBoxX - margin - 16;

  ctx.textAlign = "left";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '700 22px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  let titleY = y + 6;
  for (const line of wrapText(ctx, CAMP.formTitle, leftW)) {
    ctx.fillText(line, margin, titleY);
    titleY += 28;
  }

  const numY = titleY + 8;
  const numH = 78;
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, numY, leftW, numH, 12);
  ctx.strokeStyle = "#7a1f1a";
  ctx.lineWidth = 2.5;
  strokeRoundRect(ctx, margin, numY, leftW, numH, 12);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, margin + 5, numY + 5, leftW - 10, numH - 10, 8);
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '600 15px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText("पंजीकरण क्रमांक", margin + 18, numY + 28);
  ctx.font = '700 34px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(registrationNumber, margin + 18, numY + 62);

  ctx.fillStyle = "#c45308";
  ctx.font = '700 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let dateY = numY + numH + 24;
  for (const line of wrapText(ctx, CAMP.dateLine, leftW)) {
    ctx.fillText(line, margin, dateY);
    dateY += 22;
  }

  ctx.fillStyle = "#ffffff";
  fillRoundRect(ctx, qrBoxX, y, qrBox, qrBox + 22, 14);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 2;
  strokeRoundRect(ctx, qrBoxX, y, qrBox, qrBox + 22, 14);
  const qrInner = (qrBox - qrSize) / 2;
  drawQr(ctx, registrationNumber, qrBoxX + qrInner, y + 10, qrSize);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '600 13px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText("पंजीकरण QR", qrBoxX + qrBox / 2, y + qrBox + 12);

  y = Math.max(dateY + 8, y + qrBox + 30);
  const boxW = width - margin * 2;
  const labelW = 268;
  const valueX = margin + labelW;
  const valueMax = boxW - labelW - 16;
  ctx.textAlign = "left";
  const rows = Object.entries(details);
  rows.forEach(([label, value], index) => {
    ctx.font = '700 18px "Noto Sans Devanagari", "Noto Sans", sans-serif';
    const valueLines = wrapText(ctx, value, valueMax);
    const rowH = Math.max(46, 16 + valueLines.length * 22);
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
    const textY = y + 20 + (rowH - 20 - (valueLines.length - 1) * 22) / 2;
    ctx.fillStyle = "#7a1f1a";
    ctx.font = '600 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
    ctx.fillText(label, margin + 14, textY);
    ctx.fillStyle = "#1b2a4a";
    ctx.font = '700 18px "Noto Sans Devanagari", "Noto Sans", sans-serif';
    valueLines.forEach((line, i) => {
      ctx.fillText(line, valueX, textY + i * 22);
    });
    y += rowH;
  });

  y += 14;
  const instrBottom = height - footerH - 10;
  const instrH = Math.max(120, instrBottom - y);
  ctx.fillStyle = "#fffdf8";
  fillRoundRect(ctx, margin, y, boxW, instrH, 14);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, margin, y, boxW, instrH, 14);

  ctx.fillStyle = "#1f7a4d";
  fillRoundRect(ctx, margin + 10, y + 10, boxW - 20, 48, 10);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fffdf8";
  ctx.font = '700 18px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.operationNote, width / 2, y + 40);

  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.freeNote, width / 2, y + 80);

  ctx.textAlign = "left";
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '600 15px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let docsY = y + 110;
  for (const line of wrapText(ctx, CAMP.documentsHeading, boxW - 36)) {
    ctx.fillText(line, margin + 18, docsY);
    docsY += 20;
  }
  ctx.fillStyle = "#1a1510";
  ctx.font = '500 15px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  DOCUMENTS.forEach((doc, i) => {
    ctx.fillText(`${i + 1}. ${doc}`, margin + 18, docsY + 8 + i * 22);
  });

  const addrY = docsY + 8 + DOCUMENTS.length * 22 + 16;
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '600 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let hospitalY = addrY;
  for (const line of wrapText(ctx, `हॉस्पिटल पता: ${CAMP.hospital}`, boxW - 36)) {
    ctx.fillText(line, margin + 18, hospitalY);
    hospitalY += 18;
  }
  ctx.font = '400 14px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillStyle = "#6b5e52";
  for (const line of wrapText(ctx, CAMP.address, boxW - 36)) {
    ctx.fillText(line, margin + 18, hospitalY);
    hospitalY += 18;
  }

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, height - footerH, width, footerH);
  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
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
