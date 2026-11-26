/** Client-side guard for CMS-sourced links (defence in depth). */
export function safeHref(value, fallback = "#") {
  const s = String(value ?? "").trim();
  if (!s) return fallback;
  if (/^(javascript|data|vbscript|file):/i.test(s)) return fallback;
  if (s.startsWith("//")) return fallback;
  if (s.startsWith("/")) {
    if (/^\/(?:admin|api|uploads|private|data)(?:\/|$)/i.test(s)) {
      return fallback;
    }
    return s;
  }
  if (/^https:\/\//i.test(s) || /^mailto:/i.test(s) || /^tel:/i.test(s)) {
    return s;
  }
  return fallback;
}