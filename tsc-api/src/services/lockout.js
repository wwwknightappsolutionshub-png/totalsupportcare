import { db, nowIso } from "../db/index.js";
import { config } from "../config.js";

function keyAccount(email) {
  return `acct:${String(email || "").trim().toLowerCase()}`;
}

function keyIp(ip) {
  return `ip:${String(ip || "unknown")}`;
}

export function getClientIp(req) {
  const raw = req.ip || req.socket?.remoteAddress || "";
  return String(raw).replace(/^::ffff:/, "") || "unknown";
}

function getRow(key) {
  return db
    .prepare(
      "SELECT key, failed_count, locked_until, updated_at FROM auth_throttle WHERE key = ?"
    )
    .get(key);
}

function upsertFailure(key, now, lockUntil) {
  const row = getRow(key);
  if (!row) {
    db.prepare(
      `INSERT INTO auth_throttle (key, failed_count, locked_until, updated_at)
       VALUES (?, 1, ?, ?)`
    ).run(key, lockUntil, now);
    return { failed_count: 1, locked_until: lockUntil };
  }

  const nextCount = Number(row.failed_count || 0) + 1;
  const shouldLock = nextCount >= config.auth.maxFailedAttempts;
  const nextLock =
    shouldLock
      ? new Date(Date.now() + config.auth.lockoutMs).toISOString()
      : row.locked_until && new Date(row.locked_until).getTime() > Date.now()
        ? row.locked_until
        : null;

  db.prepare(
    `UPDATE auth_throttle
     SET failed_count = ?, locked_until = ?, updated_at = ?
     WHERE key = ?`
  ).run(nextCount, nextLock, now, key);

  return { failed_count: nextCount, locked_until: nextLock };
}

function clearKey(key) {
  db.prepare("DELETE FROM auth_throttle WHERE key = ?").run(key);
}

export function getLockStatus({ email, ip }) {
  const now = Date.now();
  const keys = [keyIp(ip)];
  if (email) keys.unshift(keyAccount(email));

  for (const key of keys) {
    const row = getRow(key);
    if (!row?.locked_until) continue;
    const until = new Date(row.locked_until).getTime();
    if (Number.isFinite(until) && until > now) {
      return {
        locked: true,
        retryAfterSec: Math.max(1, Math.ceil((until - now) / 1000)),
        scope: key.startsWith("ip:") ? "ip" : "account",
      };
    }
  }
  return { locked: false, retryAfterSec: 0, scope: null };
}

export function recordAuthFailure({ email, ip }) {
  const now = nowIso();
  const account = email ? upsertFailure(keyAccount(email), now, null) : null;
  const ipRow = upsertFailure(keyIp(ip), now, null);

  // Re-evaluate locks with threshold applied (upsertFailure sets lock when needed)
  const status = getLockStatus({ email, ip });
  return {
    ...status,
    accountFailures: account?.failed_count || 0,
    ipFailures: ipRow?.failed_count || 0,
  };
}

export function clearAuthFailures({ email, ip }) {
  if (email) clearKey(keyAccount(email));
  if (ip) clearKey(keyIp(ip));
}
