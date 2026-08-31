const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g; // eslint-disable-line no-control-regex
const TAGS = /<\/?[^>]+>/g;

export function sanitizeText(value: unknown, max = 120): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL, "").replace(TAGS, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

export function csvCell(value: string): string {
  const safe = value.replace(/\r?\n/g, " ").trim();
  const guarded = /^[=+\-@]/.test(safe) ? `'${safe}` : safe;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function likeContains(value: string): string {
  return `%${value.replace(/[%_\\]/g, "")}%`;
}
