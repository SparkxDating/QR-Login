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
    const dx = cx - dw / 2;
    const extra = dh - size;
    const dy = cy - radius - extra * cropY;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff6ea";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawNameCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  ctx.font = '600 18px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  const lines = wrapText(ctx, text, maxWidth - 20);
  const lineH = 24;
  const padX = 12;
  const padY = 6;
  const boxH = padY * 2 + lines.length * lineH;
  const boxW = Math.min(
    maxWidth,
    Math.max(...lines.map((line) => ctx.measureText(line).width)) + padX * 2,
  );
  const boxX = x - boxW / 2;
  ctx.fillStyle = "#7a1f1a";
  fillRoundRect(ctx, boxX, y, boxW, boxH, boxH / 2);
  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + padY + 17 + i * lineH);
  });
  return boxH;
}

function drawSlip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  registrationNumber: string,
  details: Record<string, string>,
  portraits: SlipPhoto[],
  organizer: SlipPhoto,
) {
  ctx.fillStyle = "#fff6ea";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, 0, width, 96);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(0, 96, width, 7);

  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  ctx.font = '600 26px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.foundation, width / 2, 40);
  ctx.font = '500 20px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.hospital, width / 2, 72);

  let y = 140;
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 28px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  ctx.fillText(CAMP.inspiration, width / 2, y);

  const radius = 78;
  const portraitY = y + 28 + radius;
  const gap = width / 4;
  portraits.forEach((person, i) => {
    const cx = gap * (i + 1);
    drawCoverCircle(ctx, person.img, cx, portraitY, radius, person.cropY);
    const captionTop = portraitY + radius + 16;
    const captionH = drawNameCaption(ctx, person.name, cx, captionTop, gap - 16);
    ctx.fillStyle = "#1b2a4a";
    ctx.font = '500 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
    ctx.textAlign = "center";
    let titleY = captionTop + captionH + 22;
    for (const line of wrapText(ctx, person.title, gap - 12)) {
      ctx.fillText(line, cx, titleY);
      titleY += 20;
    }
  });

  y = portraitY + radius + 92;

  ctx.strokeStyle = "#c4a35a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, y);
  ctx.lineTo(width * 0.82, y);
  ctx.stroke();
  ctx.fillStyle = "#c4a35a";
  ctx.save();
  ctx.translate(width / 2, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();

  y += 28;
  const orgR = 52;
  const orgX = 150;
  const orgCy = y + orgR;
  drawCoverCircle(ctx, organizer.img, orgX, orgCy, orgR, organizer.cropY);
  ctx.textAlign = "left";
  const textX = orgX + orgR + 28;
  ctx.fillStyle = "#c4a35a";
  ctx.font = '600 18px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.organizerRole, textX, orgCy - 22);
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 26px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  ctx.fillText(CAMP.organizer, textX, orgCy + 10);
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '400 16px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  let honorY = orgCy + 34;
  for (const line of wrapText(ctx, CAMP.organizerHonor, width - textX - 70)) {
    ctx.fillText(line, textX, honorY);
    honorY += 20;
  }

  y = Math.max(orgCy + orgR + 28, honorY + 16);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '700 30px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  for (const line of wrapText(ctx, CAMP.formTitle, width - 120)) {
    ctx.fillText(line, width / 2, y);
    y += 38;
  }

  y += 8;
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 34px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(`पंजीकरण क्रमांक: ${registrationNumber}`, width / 2, y);
  y += 40;
  ctx.fillStyle = "#c45308";
  ctx.font = '700 22px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.dateLine, width - 120)) {
    ctx.fillText(line, width / 2, y);
    y += 30;
  }

  y += 16;
  const boxX = 70;
  const boxW = width - 140;
  ctx.textAlign = "left";
  ctx.font = '500 20px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const [label, value] of Object.entries(details)) {
    const valueX = boxX + 260;
    const valueMax = boxW - 280;
    const valueLines = wrapText(ctx, value, valueMax);
    const rowH = Math.max(44, 16 + valueLines.length * 24);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(boxX, y - 26, boxW, rowH);
    ctx.strokeStyle = "#ead9c8";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, y - 26, boxW, rowH);
    ctx.fillStyle = "#7a1f1a";
    ctx.fillText(label, boxX + 14, y);
    ctx.fillStyle = "#1a1510";
    valueLines.forEach((line, i) => {
      ctx.fillText(line, valueX, y + i * 24);
    });
    y += rowH + 4;
  }

  y += 16;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1f7a4d";
  ctx.font = '700 20px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.operationNote, width - 140)) {
    ctx.fillText(line, width / 2, y);
    y += 28;
  }

  y += 10;
  ctx.fillStyle = "#6b5e52";
  ctx.font = '400 17px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.address, width - 140)) {
    ctx.fillText(line, width / 2, y);
    y += 24;
  }

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, height - 62, width, 62);
  ctx.fillStyle = "#fffdf8";
  ctx.font = '600 20px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.freeNote, width / 2, height - 24);
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

  const [jagatguru, modi, yogi, bhola] = await Promise.all([
    loadImage(PHOTOS.jagatguru.src),
    loadImage(PHOTOS.modi.src),
    loadImage(PHOTOS.yogi.src),
    loadImage(PHOTOS.bhola.src),
  ]);

  const width = 1240;
  const height = 1850;
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
      0.88,
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
