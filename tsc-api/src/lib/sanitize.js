/** Strip control chars and normalize whitespace for user-facing text fields. */
export function sanitizeText(value, { max } = {}) {
  let s = String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (typeof max === "number" && s.length > max) s = s.slice(0, max);
  return s;
}

/** Multiline text: keep newlines, strip other control chars. */
export function sanitizeMultiline(value, { max } = {}) {
  let s = String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (typeof max === "number" && s.length > max) s = s.slice(0, max);
  return s;
}

const SAFE_HREF =
  /^(?:\/[a-zA-Z0-9/_\-.?#&=%]+|https:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+\d()\-\s.]+)$/i;

const SAFE_IMAGE =
  /^(?:\/[a-zA-Z0-9/_\-.%]+|https:\/\/[^\s<>"']+)$/i;

const RESERVED_PATH_PREFIX =
  /^\/(?:admin|api|uploads|private|data)(?:\/|$)/i;

/** Single-slash internal app paths (no protocol-relative //evil.com). */
export function isSafeInternalPath(value) {
  const s = String(value ?? "").trim();
  if (!s || s.length > 500) return false;
  if (!s.startsWith("/") || s.startsWith("//")) return false;
  if (/\s/.test(s) || /[\u0000-\u001f]/.test(s)) return false;
  if (!/^\/[a-zA-Z0-9/_\-.?#&=%]*$/.test(s)) return false;
  if (RESERVED_PATH_PREFIX.test(s)) return false;
  return true;
}

/** Allow internal paths, https, mailto, tel — reject javascript:/data:/etc. */
export function isSafeHref(value) {
  const s = String(value ?? "").trim();
  if (!s || s.length > 2000) return false;
  if (/^(javascript|data|vbscript|file):/i.test(s)) return false;
  if (s.startsWith("//")) return false;
  if (s.startsWith("/") && !s.startsWith("//")) {
    return isSafeInternalPath(s);
  }
  return SAFE_HREF.test(s);
}

/** Allow relative app paths or https image URLs. */
export function isSafeImageUrl(value) {
  const s = String(value ?? "").trim();
  if (!s || s.length > 2000) return false;
  if (/^(javascript|data|vbscript|file):/i.test(s)) return false;
  if (s.startsWith("//")) return false;
  if (s.startsWith("/")) return isSafeInternalPath(s);
  return SAFE_IMAGE.test(s);
}

export function isPhoneLike(value) {
  const s = String(value ?? "").trim();
  if (!s) return true;
  if (s.length > 40) return false;
  return /^[\d\s+().\-extEXT#]+$/.test(s);
}
