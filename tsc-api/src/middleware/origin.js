import { config } from "../config.js";

/**
 * Browsers send Origin on cross-site POSTs; same-site XHR/fetch sends Origin too.
 * Reject state-changing API calls whose Origin/Referer don't match APP_ORIGINS
 * (defence-in-depth vs cookie-session CSRF).
 */
export function requireTrustedOrigin(req, res, next) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const origin = req.get("origin");
  if (origin) {
    if (config.appOrigins.includes(origin)) return next();
    return res.status(403).json({ error: "forbidden_origin" });
  }

  const referer = req.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      const candidate = `${u.protocol}//${u.host}`;
      if (config.appOrigins.includes(candidate)) return next();
    } catch {
      /* invalid referer */
    }
    return res.status(403).json({ error: "forbidden_origin" });
  }

  // Non-browser clients (curl, uptime checks) — allow only outside production.
  if (!config.isProd) return next();
  return res.status(403).json({ error: "forbidden_origin" });
}