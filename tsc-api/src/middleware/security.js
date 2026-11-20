import { config } from "../config.js";

const BLOCKED_PATH =
  /(?:^|\/)(?:\.env(?:\..*)?|secrets(?:\/|$)|private(?:\/|$)|data\/[^/]*\.db|\.git(?:\/|$)|\.svn(?:\/|$)|\.hg(?:\/|$)|\.DS_Store|thumbs\.db|web\.config|\.htaccess|\.htpasswd|docker-compose(?:\..*)?\.ya?ml|Dockerfile(?:\..*)?|composer\.(?:json|lock)|package(?:-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|id_rsa|\.pem$|\.key$|\.p12$|\.pfx$|\.crt$|\.cer$)/i;

/**
 * Strip fingerprinting headers and apply hardened defaults for every response.
 */
export function hardenResponseHeaders(_req, res, next) {
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");

  // Belt-and-braces if a proxy injects these later in the same hop
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    const lower = String(name).toLowerCase();
    if (lower === "x-powered-by" || lower === "server") return res;
    return originalSetHeader(name, value);
  };

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  if (config.isProd) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }
  return next();
}

/** Reject probes for secrets, VCS metadata, and dependency manifests. */
export function blockSensitivePaths(req, res, next) {
  const raw = `${req.path || ""} ${req.url || ""}`;
  if (BLOCKED_PATH.test(raw)) {
    return res.status(404).json({ error: "not_found" });
  }
  return next();
}
