import { config } from "../config.js";

export async function verifyTurnstileToken(token, remoteip) {
  if (!config.turnstile.enabled) {
    // Fail closed in production — require captcha keys to be configured.
    if (config.isProd) {
      return { ok: false, error: "captcha_not_configured" };
    }
    return { ok: true, skipped: true };
  }
  if (!token || typeof token !== "string") {
    return { ok: false, error: "captcha_required" };
  }

  const body = new URLSearchParams();
  body.set("secret", config.turnstile.secretKey);
  body.set("response", token);
  if (remoteip) body.set("remoteip", remoteip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );
  const data = await res.json().catch(() => null);
  if (!data?.success) {
    return { ok: false, error: "captcha_failed" };
  }
  return { ok: true };
}
