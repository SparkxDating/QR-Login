import { CAMP } from "@/lib/camp";

const PAGE_W = 595;
const PAGE_H = 842;
const enc = new TextEncoder();

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

function drawSlip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  registrationNumber: string,
  details: Record<string, string>,
) {
  ctx.fillStyle = "#fff6ea";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, 0, width, 118);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(0, 118, width, 8);

  ctx.fillStyle = "#fffdf8";
  ctx.textAlign = "center";
  ctx.font = '600 28px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.foundation, width / 2, 48);
  ctx.font = '500 22px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.hospital, width / 2, 86);

  let y = 180;
  ctx.fillStyle = "#1b2a4a";
  ctx.font = '700 36px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
  for (const line of wrapText(ctx, CAMP.formTitle, width - 120)) {
    ctx.fillText(line, width / 2, y);
    y += 46;
  }

  y += 18;
  ctx.fillStyle = "#7a1f1a";
  ctx.font = '700 40px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(`पंजीकरण क्रमांक: ${registrationNumber}`, width / 2, y);
  y += 48;
  ctx.fillStyle = "#c45308";
  ctx.font = '700 26px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.dateLine, width - 120)) {
    ctx.fillText(line, width / 2, y);
    y += 36;
  }

  y += 24;
  const boxX = 70;
  const boxW = width - 140;
  ctx.textAlign = "left";
  ctx.font = '500 24px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const [label, value] of Object.entries(details)) {
    const valueX = boxX + 280;
    const valueMax = boxW - 300;
    const valueLines = wrapText(ctx, value, valueMax);
    const rowH = Math.max(52, 20 + valueLines.length * 30);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(boxX, y - 30, boxW, rowH);
    ctx.strokeStyle = "#ead9c8";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, y - 30, boxW, rowH);
    ctx.fillStyle = "#7a1f1a";
    ctx.fillText(label, boxX + 16, y);
    ctx.fillStyle = "#1a1510";
    valueLines.forEach((line, i) => {
      ctx.fillText(line, valueX, y + i * 30);
    });
    y += rowH + 6;
  }

  y += 20;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1f7a4d";
  ctx.font = '700 24px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.operationNote, width - 140)) {
    ctx.fillText(line, width / 2, y);
    y += 34;
  }

  y += 16;
  ctx.fillStyle = "#6b5e52";
  ctx.font = '400 20px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  for (const line of wrapText(ctx, CAMP.address, width - 140)) {
    ctx.fillText(line, width / 2, y);
    y += 28;
  }

  ctx.fillStyle = "#7a1f1a";
  ctx.fillRect(0, height - 70, width, 70);
  ctx.fillStyle = "#fffdf8";
  ctx.font = '600 22px "Noto Sans Devanagari", "Noto Sans", sans-serif';
  ctx.fillText(CAMP.freeNote, width / 2, height - 28);
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

  const width = 1240;
  const height = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("pdf");
  drawSlip(ctx, width, height, registrationNumber, details);

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
      0.86,
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
