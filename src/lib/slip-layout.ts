import { CAMP, DOCUMENTS } from "@/lib/camp";
import {
  drawCoverCircle,
  drawQr,
  fillRoundRect,
  strokeRoundRect,
  wrapText,
  type SlipPhoto,
} from "@/lib/slip-primitives";

export function drawSlip(
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
