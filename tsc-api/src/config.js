import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const secretsDir = path.join(rootDir, "secrets");

// Prefer secrets/.env (not web-reachable). Fall back to root .env for local compat.
const envCandidates = [
  path.join(secretsDir, ".env"),
  path.join(rootDir, ".env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

const defaultOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

const configuredOrigins = (process.env.APP_ORIGINS || process.env.APP_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  appOrigins:
    configuredOrigins.length > 0
      ? configuredOrigins
      : defaultOrigins,
  jwtSecret: required(
    "JWT_SECRET",
    "dev-only-secret-change-before-production-32c"
  ),
  adminEmail: (process.env.ADMIN_EMAIL || "admin@totalsupportcare.co.uk").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "ChangeMeNow!Tsc2026",
  hrEmail: (process.env.HR_EMAIL || "hr@totalsupportcare.co.uk").toLowerCase(),
  hrPassword: process.env.HR_PASSWORD || "HrTsc2026!",
  hrNotifyEmail:
    process.env.HR_NOTIFY_EMAIL ||
    process.env.HR_EMAIL ||
    "info@totalsupportcare.co.uk",
  hrNotifyPhone: process.env.HR_NOTIFY_PHONE || "",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieName: "tsc_admin_session",
  dbPath: path.join(rootDir, "data", "tsc.db"),
  secretsDir,
  /**
   * TSC-only build: marketplace permanently off (no pack switcher).
   */
  packMarketplaceEnabled: false,
  uploadsDir: path.join(rootDir, "uploads"),
  cvsDir: path.join(rootDir, "private", "cvs"),
  applyMinSubmitMs: Number(process.env.APPLY_MIN_SUBMIT_MS || 3000),
  applyMaxAgeMs: Number(process.env.APPLY_MAX_AGE_MS || 2 * 60 * 60 * 1000),
  auth: {
    maxFailedAttempts: Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 5),
    lockoutMs: Number(process.env.AUTH_LOCKOUT_MS || 30 * 60 * 1000),
    resetTokenTtlMs: Number(process.env.AUTH_RESET_TOKEN_TTL_MS || 30 * 60 * 1000),
  },
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY || "",
    secretKey: process.env.TURNSTILE_SECRET_KEY || "",
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === "true",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  },
};

if (config.isProd && config.jwtSecret.startsWith("dev-only-secret")) {
  throw new Error("JWT_SECRET must be set to a unique production secret");
}

config.turnstile.enabled = Boolean(
  config.turnstile.siteKey && config.turnstile.secretKey
);

if (config.isProd && config.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

const FORBIDDEN_PROD_PASSWORDS = new Set([
  "ChangeMeNow!Kerry2026",
  "HrKerry2026!",
  "ChangeMeNow!Tsc2026",
  "HrTsc2026!",
  "password",
  "Password1",
  "admin",
  "changeme",
]);

config.forbiddenPasswords = [...FORBIDDEN_PROD_PASSWORDS];

function assertProdPassword(name, value) {
  if (!config.isProd) return;
  if (FORBIDDEN_PROD_PASSWORDS.has(value)) {
    throw new Error(`${name} must be changed in production`);
  }
  if (value.length < 12) {
    throw new Error(`${name} must be at least 12 characters in production`);
  }
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new Error(
      `${name} must include upper, lower, and a digit in production`
    );
  }
  // Reject trivial repetition (e.g. Aaaaaaaaaaa1)
  if (/^(.)\1+$/.test(value.replace(/[^A-Za-z0-9]/g, ""))) {
    throw new Error(`${name} is too weak for production`);
  }
}

assertProdPassword("ADMIN_PASSWORD", config.adminPassword);
assertProdPassword("HR_PASSWORD", config.hrPassword);

if (config.isProd && !config.turnstile.enabled) {
  throw new Error(
    "TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are required in production"
  );
}

if (config.isProd) {
  const origins = config.appOrigins;
  const onlyLocal = origins.every(
    (o) =>
      o.startsWith("http://127.0.0.1") ||
      o.startsWith("http://localhost") ||
      o.startsWith("https://127.0.0.1") ||
      o.startsWith("https://localhost")
  );
  if (!process.env.APP_ORIGINS && !process.env.APP_ORIGIN) {
    throw new Error("APP_ORIGINS must be set explicitly in production");
  }
  if (onlyLocal) {
    throw new Error(
      "APP_ORIGINS must include your public site origin in production"
    );
  }
}

/** Bind address — default loopback so the API is not exposed on LAN by accident. */
config.host = process.env.HOST || "127.0.0.1";

if (
  config.host !== "127.0.0.1" &&
  config.host !== "localhost" &&
  config.host !== "::1" &&
  !config.isProd
) {
  throw new Error(
    "Non-loopback HOST requires NODE_ENV=production (refusing to expose API with dev auth/captcha shortcuts)"
  );
}
