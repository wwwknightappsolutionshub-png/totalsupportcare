/** Reserved URL prefixes that must never be CMS slugs or public page paths. */
const RESERVED_PREFIXES = [
  "/admin",
  "/api",
  "/uploads",
  "/private",
  "/data",
  "/.well-known",
];

/**
 * Normalize a site path for lookup (leading slash, no trailing slash except "/").
 */
export function normalizePublicPath(raw) {
  let pagePath = String(raw ?? "/").trim();
  if (!pagePath || pagePath === "") pagePath = "/";
  if (!pagePath.startsWith("/")) pagePath = `/${pagePath}`;
  if (pagePath.includes("\\")) return null;
  if (pagePath.includes("..")) return null;
  if (/%2f|%5c/i.test(pagePath)) return null;
  if (pagePath.length > 160) return null;
  if (pagePath.length > 1 && pagePath.endsWith("/")) {
    pagePath = pagePath.slice(0, -1);
  }
  return pagePath;
}

/** True if path is safe to expose on the public site / sitemap. */
export function isSafePublicPath(pagePath) {
  const p = normalizePublicPath(pagePath);
  if (!p) return false;
  if (p === "/") return true;
  if (!/^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/.test(p)) return false;
  const lower = p.toLowerCase();
  return !RESERVED_PREFIXES.some(
    (prefix) => lower === prefix || lower.startsWith(`${prefix}/`)
  );
}

/** Escape text for XML element content (sitemap loc / lastmod). */
export function escapeXmlText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}