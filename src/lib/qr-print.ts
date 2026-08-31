import { escapeHtml } from "@/lib/sanitize";

export function downloadQrPng(svgId: string, filename: string) {
  const svg = document.getElementById(svgId);
  if (!(svg instanceof SVGSVGElement)) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffdf9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((png) => {
      URL.revokeObjectURL(url);
      if (!png) return;
      const href = URL.createObjectURL(png);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    }, "image/png");
  };
  image.src = url;
}

export function printQr(svgId: string, caption: string, url: string) {
  const svg = document.getElementById(svgId);
  if (!(svg instanceof SVGSVGElement)) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const frame = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
  if (!frame) return;
  frame.document.write(`<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"/><title>QR</title>
<style>
  body{font-family:"Noto Sans Devanagari",system-ui,sans-serif;text-align:center;padding:24px;color:#1b2a4a}
  svg{width:280px;height:280px}
  p{margin:8px 0}
</style></head><body>
${xml}
<p style="font-weight:700">${escapeHtml(caption)}</p>
<p style="word-break:break-all;font-size:13px">${escapeHtml(url)}</p>
</body></html>`);
  frame.document.close();
  frame.focus();
  frame.print();
}
