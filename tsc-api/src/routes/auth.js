import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { config } from "../config.js";
import { db, nowIso } from "../db/index.js";
import {
  bumpSessionVersion,
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signAdminToken,
} from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/public.js";
import { emailField } from "../schemas/primitives.js";
import {
  clearAuthFailures,
  getClientIp,
  getLockStatus,
  recordAuthFailure,
} from "../services/lockout.js";

const router = Router();

/** Constant-time decoy so missing users still pay bcrypt cost */
const DUMMY_HASH = bcrypt.hashSync(
  "kerry-lockout-dummy-password-not-a-real-account",
  12
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const resetCompleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(200),
  newPassword: z
    .string()
    .min(10)
    .max(200)
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
      message: "password_complexity",
    }),
});

const resetRequestSchema = z.object({
  email: emailField,
});

const resetCompleteSchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: z
    .string()
    .min(10)
    .max(200)
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
      message: "password_complexity",
    }),
});

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sendLocked(res, status) {
  res.setHeader("Retry-After", String(status.retryAfterSec || 60));
  return res.status(429).json({
    error: "account_locked",
    retryAfterSec: status.retryAfterSec,
  });
}

router.post("/login", loginLimiter, validate(loginSchema), (req, res) => {
  const email = req.body.email;
  const ip = getClientIp(req);
  const lock = getLockStatus({ email, ip });
  if (lock.locked) return sendLocked(res, lock);

  const user = db
    .prepare(
      "SELECT id, email, password_hash, role, session_version FROM admin_users WHERE email = ?"
    )
    .get(email);

  const hash = user?.password_hash || DUMMY_HASH;
  const passwordOk = bcrypt.compareSync(req.body.password, hash);

  if (!user || !passwordOk) {
    const failure = recordAuthFailure({ email, ip });
    if (failure.locked) return sendLocked(res, failure);
    return res.status(401).json({ error: "invalid_credentials" });
  }

  clearAuthFailures({ email, ip });
  // Single active session: bump version so any other device/browser is invalidated.
  const sessionUser = bumpSessionVersion(user.id);
  const token = signAdminToken(sessionUser || user);
  setSessionCookie(res, token);
  return res.json({
    user: {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
    },
  });
});

router.post("/logout", (req, res) => {
  const token = req.cookies?.[config.cookieName];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret, {
        algorithms: ["HS256"],
      });
      if (payload?.sub) bumpSessionVersion(payload.sub);
    } catch {
      /* ignore invalid/expired cookies */
    }
  }
  clearSessionCookie(res);
  return res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.admin });
});

router.post(
  "/change-password",
  requireAuth,
  changePasswordLimiter,
  validate(changePasswordSchema),
  (req, res) => {
    const ip = getClientIp(req);
    const email = req.admin.email;
    const lock = getLockStatus({ email, ip });
    if (lock.locked) return sendLocked(res, lock);

    const user = db
      .prepare(
        "SELECT id, email, password_hash, role, session_version FROM admin_users WHERE id = ?"
      )
      .get(req.admin.id);

    if (!user || !bcrypt.compareSync(req.body.currentPassword, user.password_hash)) {
      const failure = recordAuthFailure({ email, ip });
      if (failure.locked) return sendLocked(res, failure);
      return res.status(401).json({ error: "invalid_credentials" });
    }

    if (req.body.currentPassword === req.body.newPassword) {
      return res.status(400).json({ error: "password_unchanged" });
    }

    const passwordHash = bcrypt.hashSync(req.body.newPassword, 12);
    const now = nowIso();
    db.prepare(
      "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?"
    ).run(passwordHash, now, user.id);

    clearAuthFailures({ email, ip });
    const rotated = bumpSessionVersion(user.id);
    const token = signAdminToken(rotated || user);
    setSessionCookie(res, token);
    return res.json({ ok: true });
  }
);

/**
 * Always returns ok to avoid account enumeration.
 * Token is logged until SMTP is wired (ops can deliver out-of-band).
 */
router.post(
  "/request-password-reset",
  resetRequestLimiter,
  validate(resetRequestSchema),
  (req, res) => {
    const email = req.body.email;
    const ip = getClientIp(req);
    const lock = getLockStatus({ email, ip });
    if (lock.locked) return sendLocked(res, lock);

    const user = db
      .prepare("SELECT id, email FROM admin_users WHERE email = ?")
      .get(email);

    let rawToken = null;
    if (user) {
      db.prepare(
        "DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL"
      ).run(user.id);

      rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(rawToken);
      const now = nowIso();
      const expires = new Date(
        Date.now() + config.auth.resetTokenTtlMs
      ).toISOString();

      db.prepare(
        `INSERT INTO password_reset_tokens
         (id, user_id, token_hash, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`
      ).run(uuid(), user.id, tokenHash, expires, now);

      // Never log raw tokens in production (SMTP not wired yet).
      if (!config.isProd) {
        console.info(
          `[auth:password-reset] email=${user.email} token=${rawToken} expires=${expires}`
        );
      } else {
        console.info(
          `[auth:password-reset] issued for ${user.email} expires=${expires}`
        );
      }
    } else {
      // Spend similar time to reduce timing oracle
      bcrypt.compareSync("not-the-password", DUMMY_HASH);
    }

    const payload = {
      ok: true,
      message: "If that account exists, reset instructions were issued.",
    };
    // Dev-only: return token so local ops can complete reset without SMTP.
    if (!config.isProd && rawToken) {
      payload.devResetToken = rawToken;
    }
    return res.json(payload);
  }
);

router.post(
  "/reset-password",
  resetCompleteLimiter,
  validate(resetCompleteSchema),
  (req, res) => {
    const ip = getClientIp(req);
    const lock = getLockStatus({ email: null, ip });
    if (lock.locked) return sendLocked(res, lock);

    const tokenHash = hashResetToken(req.body.token);
    const row = db
      .prepare(
        `SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email
         FROM password_reset_tokens t
         JOIN admin_users u ON u.id = t.user_id
         WHERE t.token_hash = ?`
      )
      .get(tokenHash);

    const invalid = () => {
      const failure = recordAuthFailure({ email: row?.email, ip });
      if (failure.locked) return sendLocked(res, failure);
      return res.status(400).json({ error: "invalid_or_expired_token" });
    };

    if (!row || row.used_at) return invalid();
    if (new Date(row.expires_at).getTime() <= Date.now()) return invalid();

    const passwordHash = bcrypt.hashSync(req.body.newPassword, 12);
    const now = nowIso();
    const tx = db.transaction(() => {
      db.prepare(
        "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?"
      ).run(passwordHash, now, row.user_id);
      db.prepare(
        "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?"
      ).run(now, row.id);
      db.prepare(
        "DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL"
      ).run(row.user_id);
    });
    tx();
    bumpSessionVersion(row.user_id);

    clearAuthFailures({ email: row.email, ip });
    clearSessionCookie(res);
    return res.json({ ok: true });
  }
);

export default router;
