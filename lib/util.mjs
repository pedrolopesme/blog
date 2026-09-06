// Small, dependency-free helpers shared across the build.

/** Turn arbitrary text into a URL-safe slug (accent-aware). */
export function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Escape a string for safe interpolation into HTML text/attributes. */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Resolve a root-relative path ("/posts/") against the site baseUrl.
 *  Absolute URLs (http, mailto, #...) and already-based paths pass through. */
export function withBase(baseUrl, href) {
  if (!href) return href;
  if (/^([a-z]+:)?\/\//i.test(href) || /^(mailto:|tel:|#|data:)/i.test(href)) {
    return href;
  }
  if (!href.startsWith("/")) return href; // relative, leave as-is
  return (baseUrl.replace(/\/$/, "") + href).replace(/\/{2,}/g, "/");
}

/** Build an absolute URL (siteUrl + baseUrl + path) for feeds/canonical. */
export function absoluteUrl(siteUrl, baseUrl, path) {
  const p = withBase(baseUrl, path.startsWith("/") ? path : "/" + path);
  return siteUrl.replace(/\/$/, "") + p;
}

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Parse a date value into a Date (accepts Date, ISO string, YYYY-MM-DD). */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    // Treat bare YYYY-MM-DD as local noon to avoid TZ off-by-one.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** Human, editorial date: "5 de setembro de 2026". */
export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

/** ISO date (YYYY-MM-DD) for <time datetime> and sorting. */
export function isoDate(value) {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : "";
}

/** RFC-822 date for RSS. */
export function rfc822(value) {
  const d = toDate(value);
  return d ? d.toUTCString() : "";
}

/** Rough reading time in minutes from rendered HTML. */
export function readingTime(html) {
  const text = String(html).replace(/<[^>]+>/g, " ");
  const words = (text.match(/\S+/g) || []).length;
  return Math.max(1, Math.round(words / 220));
}

/** Derive a plain-text excerpt from rendered HTML (first paragraph-ish). */
export function excerptFromHtml(html, max = 200) {
  const text = String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
