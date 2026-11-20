import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { db } from "../db/index.js";

export function signAdminToken(user) {
  const sessionVersion = Number(user.session_version || 0);
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      sv: sessionVersion,
    },
    config.jwtSecret,
    { expiresIn: "8h", algorithm: "HS256" }
  );
}

export function setSessionCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure || config.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.cookieSecure || config.isProd,
    sameSite: "lax",
    path: "/",
  });
}

export function bumpSessionVersion(userId) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE admin_users
     SET session_version = COALESCE(session_version, 0) + 1,
         updated_at = ?
     WHERE id = ?`
  ).run(now, userId);
  return db
    .prepare(
      "SELECT id, email, role, session_version FROM admin_users WHERE id = ?"
    )
    .get(userId);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[config.cookieName];
  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
    });
    const row = db
      .prepare(
        "SELECT id, email, role, session_version FROM admin_users WHERE id = ?"
      )
      .get(payload.sub);
    if (!row) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "unauthorized" });
    }
    const currentSv = Number(row.session_version || 0);
    if (Number(payload.sv || 0) !== currentSv) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "unauthorized" });
    }
    req.admin = {
      id: row.id,
      email: row.email,
      role: row.role,
      session_version: currentSv,
    };
    return next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ error: "unauthorized" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    return next();
  };
}
