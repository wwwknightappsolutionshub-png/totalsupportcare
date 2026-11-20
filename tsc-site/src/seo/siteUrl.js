/** Canonical site origin for absolute SEO URLs. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://www.totalsupportcare.co.uk"
).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return `${SITE_URL}/`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function absoluteAsset(path) {
  if (!path) return absoluteUrl("/og-default.jpg");
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return absoluteUrl(path);
}
