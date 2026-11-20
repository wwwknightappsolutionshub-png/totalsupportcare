export function sanitizeText(value, { max } = {}) {
  let s = String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (typeof max === "number" && s.length > max) s = s.slice(0, max);
  return s;
}

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
  /^(?:\/[a-zA-Z0-9/_\-.?#&=%]*|https:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+\d()\-\s.]+)$/i;

export function isSafeHref(value) {
  const s = String(value ?? "").trim();
  if (!s || s.length > 2000) return false;
  if (/^(javascript|data|vbscript|file):/i.test(s)) return false;
  return SAFE_HREF.test(s);
}

export function isPhoneLike(value) {
  const s = String(value ?? "").trim();
  if (!s) return true;
  if (s.length > 40) return false;
  return /^[\d\s+().\-extEXT#]+$/.test(s);
}

export function firstErrorMessage(zodError) {
  const flat = zodError?.flatten?.();
  if (!flat) return "Please check the form and try again.";
  const field = Object.values(flat.fieldErrors || {}).flat()[0];
  if (field) return String(field);
  if (flat.formErrors?.[0]) return String(flat.formErrors[0]);
  return "Please check the form and try again.";
}
