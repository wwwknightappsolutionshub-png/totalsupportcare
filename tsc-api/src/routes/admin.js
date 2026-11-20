import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { config } from "../config.js";
import { db, nowIso } from "../db/index.js";
import { sniffFileMime } from "../lib/fileSniff.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { cmsSectionsSchema } from "../schemas/cms.js";
import {
  emailField,
  safeHrefField,
  safeImageUrlField,
} from "../schemas/primitives.js";
import { notifyApplicationStatus } from "../services/notify.js";
import { sendWhatsAppText } from "../services/whatsapp.js";
import {
  activatePack,
  getActivePack,
  getPackPageById,
  listPackPages,
  listPacks,
} from "../services/packs.js";

function mediaPublicUrl(filename) {
  return `/uploads/${path.basename(filename)}`;
}

function mapMediaRow(row) {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    mime: row.mime,
    size: row.size,
    url: mediaPublicUrl(row.filename),
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function safeOriginalName(name) {
  return String(name || "upload")
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "upload";
}

const router = Router();
router.use(requireAuth);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const mediaUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_uploads" },
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
    cb(null, config.uploadsDir);
  },
  // Temporary name; renamed to sniffed extension after magic-byte check.
  filename: (_req, _file, cb) => cb(null, `${uuid()}.upload`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("invalid_file_type"));
    }
    return cb(null, true);
  },
});

router.get("/packs", requireRole("owner"), (_req, res) => {
  return res.json({
    items: listPacks(),
    active: getActivePack()?.slug || null,
    marketplaceEnabled: config.packMarketplaceEnabled,
  });
});

router.post(
  "/packs/:slug/activate",
  requireRole("owner"),
  (req, res) => {
    if (!config.packMarketplaceEnabled) {
      return res.status(403).json({ error: "marketplace_locked" });
    }
    const pack = activatePack(req.params.slug);
    if (!pack) return res.status(404).json({ error: "not_found" });
    return res.json({ ok: true, pack });
  }
);

router.get("/settings", requireRole("owner"), (_req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  return res.json({
    settings: pack.settings,
    pack: { slug: pack.slug, name: pack.name, niche: pack.niche },
    updatedAt: pack.updatedAt,
  });
});

const navItemSchema = z.object({
  label: z.string().max(80),
  to: safeHrefField,
});

const socialItemSchema = z.object({
  label: z.string().max(80),
  href: safeHrefField,
  icon: z.string().max(40).optional(),
});

const settingsSchema = z.object({
  brandName: z.string().min(1).max(120).optional(),
  logo: safeImageUrlField.optional(),
  logoIcon: safeImageUrlField.optional(),
  logoIconLime: safeImageUrlField.optional(),
  logoWordmark: safeImageUrlField.optional(),
  tagline: z.string().max(300).optional(),
  phoneDisplay: z.string().max(80).optional(),
  phoneHref: safeHrefField.optional(),
  phoneAltDisplay: z.string().max(80).optional(),
  phoneAltHref: safeHrefField.optional(),
  email: z.union([z.literal(""), emailField]).optional(),
  hrEmail: z.union([z.literal(""), emailField]).optional(),
  addressLine: z.string().max(300).optional(),
  addressShort: z.string().max(200).optional(),
  cqcUrl: safeHrefField.optional(),
  nav: z.array(navItemSchema).max(20).optional(),
  footerNav: z.array(navItemSchema).max(20).optional(),
  social: z.array(socialItemSchema).max(12).optional(),
});

router.patch("/settings", requireRole("owner"), validate(settingsSchema), (req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  const next = { ...pack.settings, ...req.body };
  const now = nowIso();
  db.prepare(
    "UPDATE site_packs SET settings_json = ?, updated_at = ? WHERE slug = ?"
  ).run(JSON.stringify(next), now, pack.slug);
  return res.json({
    settings: next,
    pack: { slug: pack.slug, name: pack.name },
    updatedAt: now,
  });
});

router.get("/pages", requireRole("owner"), (_req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  const rows = listPackPages(pack.slug);
  return res.json({
    pack: pack.slug,
    items: rows,
  });
});

router.get("/pages/by-id/:id", requireRole("owner"), (req, res) => {
  const pack = getActivePack();
  const row = getPackPageById(req.params.id);
  if (!row || !pack || row.pack_slug !== pack.slug) {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json({
    id: row.id,
    path: row.path,
    title: row.title,
    status: row.status,
    sections: JSON.parse(row.sections_json),
    draftSections: JSON.parse(row.draft_sections_json || row.sections_json),
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  });
});

const pagePatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  draftSections: cmsSectionsSchema.optional(),
});

router.patch("/pages/:id", requireRole("owner"), validate(pagePatchSchema), (req, res) => {
  const pack = getActivePack();
  const row = getPackPageById(req.params.id);
  if (!row || !pack || row.pack_slug !== pack.slug) {
    return res.status(404).json({ error: "not_found" });
  }
  const now = nowIso();
  if (req.body.title) {
    db.prepare(
      "UPDATE pack_pages SET title = ?, updated_at = ?, updated_by = ? WHERE id = ?"
    ).run(req.body.title, now, req.admin.id, req.params.id);
  }
  if (req.body.draftSections) {
    db.prepare(
      "UPDATE pack_pages SET draft_sections_json = ?, updated_at = ?, updated_by = ? WHERE id = ?"
    ).run(
      JSON.stringify(req.body.draftSections),
      now,
      req.admin.id,
      req.params.id
    );
  }
  const updated = getPackPageById(req.params.id);
  return res.json({
    id: updated.id,
    path: updated.path,
    title: updated.title,
    status: updated.status,
    sections: JSON.parse(updated.sections_json),
    draftSections: JSON.parse(
      updated.draft_sections_json || updated.sections_json
    ),
    updatedAt: updated.updated_at,
    publishedAt: updated.published_at,
  });
});

router.post("/pages/:id/publish", requireRole("owner"), (req, res) => {
  const pack = getActivePack();
  const row = getPackPageById(req.params.id);
  if (!row || !pack || row.pack_slug !== pack.slug) {
    return res.status(404).json({ error: "not_found" });
  }
  const now = nowIso();
  const draft = row.draft_sections_json || row.sections_json;
  db.prepare(
    `UPDATE pack_pages SET sections_json = ?, draft_sections_json = ?, status = 'published',
     published_at = ?, updated_at = ?, updated_by = ? WHERE id = ?`
  ).run(draft, draft, now, now, req.admin.id, row.id);
  return res.json({ ok: true, publishedAt: now });
});

const createPageSchema = z.object({
  path: z
    .string()
    .regex(/^\/[a-z0-9\-/]*$/)
    .max(120),
  title: z.string().min(1).max(200),
  sections: cmsSectionsSchema.default([]),
});

router.post("/pages", requireRole("owner"), validate(createPageSchema), (req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  const exists = db
    .prepare("SELECT id FROM pack_pages WHERE pack_slug = ? AND path = ?")
    .get(pack.slug, req.body.path);
  if (exists) return res.status(409).json({ error: "path_exists" });
  const now = nowIso();
  const id = uuid();
  const sections = JSON.stringify(req.body.sections);
  db.prepare(
    `INSERT INTO pack_pages (id, pack_slug, path, title, status, sections_json, draft_sections_json, updated_at, updated_by, published_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, NULL)`
  ).run(
    id,
    pack.slug,
    req.body.path,
    req.body.title,
    sections,
    sections,
    now,
    req.admin.id
  );
  return res.status(201).json({ id, path: req.body.path, status: "draft" });
});

router.delete("/pages/:id", requireRole("owner"), (req, res) => {
  const pack = getActivePack();
  const row = getPackPageById(req.params.id);
  if (!row || !pack || row.pack_slug !== pack.slug) {
    return res.status(404).json({ error: "not_found" });
  }
  if (row.path === "/") {
    return res.status(400).json({ error: "cannot_delete_core_page" });
  }
  db.prepare("DELETE FROM pack_pages WHERE id = ?").run(req.params.id);
  return res.status(204).end();
});

router.get("/media", requireRole("owner"), (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, filename, original_name, mime, size, created_at, created_by FROM media ORDER BY created_at DESC"
    )
    .all();
  return res.json({ items: rows.map(mapMediaRow) });
});

router.post(
  "/media",
  requireRole("owner"),
  mediaUploadLimiter,
  (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        const code =
          err.code === "LIMIT_FILE_SIZE" ? "file_too_large" : err.message;
        return res.status(400).json({ error: code || "upload_failed" });
      }
      if (!req.file) return res.status(400).json({ error: "file_required" });

      const tempPath = req.file.path;
      const sniffed = sniffFileMime(tempPath, [...ALLOWED_MIME]);
      if (!sniffed || !MIME_EXT[sniffed]) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          /* ignore */
        }
        return res.status(400).json({ error: "invalid_file_type" });
      }

      // Prefer magic-byte type over client-claimed extension/MIME.
      const finalName = `${uuid()}${MIME_EXT[sniffed]}`;
      const finalPath = path.join(config.uploadsDir, finalName);
      try {
        fs.renameSync(tempPath, finalPath);
      } catch (renameErr) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          /* ignore */
        }
        console.error("media_rename_failed", renameErr);
        return res.status(500).json({ error: "upload_failed" });
      }

      const id = uuid();
      const now = nowIso();
      const originalName = safeOriginalName(req.file.originalname);
      db.prepare(
        `INSERT INTO media (id, filename, original_name, mime, size, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        finalName,
        originalName,
        sniffed,
        req.file.size,
        now,
        req.admin.id
      );
      return res.status(201).json({
        id,
        filename: finalName,
        originalName,
        url: mediaPublicUrl(finalName),
        mime: sniffed,
        size: req.file.size,
        createdAt: now,
      });
    });
  }
);

router.delete("/media/:id", requireRole("owner"), (req, res) => {
  const row = db
    .prepare("SELECT id, filename FROM media WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "not_found" });

  // Seed assets are shared by CMS defaults — do not allow deleting them.
  if (String(row.id).startsWith("seed:") || String(row.filename).startsWith("seed-")) {
    return res.status(403).json({ error: "seed_media_locked" });
  }

  const filePath = path.join(config.uploadsDir, path.basename(row.filename));
  db.prepare("DELETE FROM media WHERE id = ?").run(row.id);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("media_file_delete_failed", err);
  }
  return res.status(204).end();
});

router.get("/contact-messages", requireRole("owner", "hr"), (req, res) => {
  const status = req.query.status;
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC LIMIT 200"
        )
        .all(String(status))
    : db
        .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200")
        .all();
  return res.json({ items: rows });
});

router.patch(
  "/contact-messages/:id",
  requireRole("owner", "hr"),
  validate(z.object({ status: z.enum(["new", "read", "replied", "archived"]) })),
  (req, res) => {
    const info = db
      .prepare("UPDATE contact_messages SET status = ? WHERE id = ?")
      .run(req.body.status, req.params.id);
    if (!info.changes) return res.status(404).json({ error: "not_found" });
    return res.json({ ok: true });
  }
);

router.get("/alerts/summary", requireRole("owner", "hr"), (_req, res) => {
  const newCount = db
    .prepare("SELECT COUNT(*) AS c FROM applications WHERE status = 'new'")
    .get().c;
  const latest = db
    .prepare(
      "SELECT id, full_name, created_at, cv_filename FROM applications ORDER BY created_at DESC LIMIT 1"
    )
    .get();
  const newEnquiries = db
    .prepare("SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'")
    .get().c;

  return res.json({
    newApplications: Number(newCount) || 0,
    newEnquiries: Number(newEnquiries) || 0,
    latestApplication: latest
      ? {
          id: latest.id,
          fullName: latest.full_name,
          createdAt: latest.created_at,
          hasCv: Boolean(latest.cv_filename),
        }
      : null,
    polledAt: new Date().toISOString(),
  });
});

router.get("/applications", requireRole("owner", "hr"), (req, res) => {
  const status = req.query.status;
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC LIMIT 200"
        )
        .all(String(status))
    : db.prepare("SELECT * FROM applications ORDER BY created_at DESC LIMIT 200").all();
  return res.json({ items: rows });
});

router.get("/applications/:id", requireRole("owner", "hr"), (req, res) => {
  const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!app) return res.status(404).json({ error: "not_found" });
  const events = db
    .prepare(
      "SELECT * FROM application_events WHERE application_id = ? ORDER BY created_at ASC"
    )
    .all(req.params.id);
  return res.json({
    application: {
      ...app,
      hasCv: Boolean(app.cv_filename),
      cvDownloadPath: app.cv_filename
        ? `/api/admin/applications/${app.id}/cv`
        : null,
    },
    events,
  });
});

router.get("/applications/:id/cv", requireRole("owner", "hr"), (req, res) => {
  const app = db
    .prepare(
      "SELECT id, cv_filename, cv_original_name, cv_mime FROM applications WHERE id = ?"
    )
    .get(req.params.id);
  if (!app?.cv_filename) return res.status(404).json({ error: "cv_not_found" });

  const safeName = path.basename(app.cv_filename);
  const filePath = path.join(config.cvsDir, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "cv_file_missing" });
  }

  const CV_MIME = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const sniffed = sniffFileMime(filePath, CV_MIME);
  if (!sniffed) {
    return res.status(415).json({ error: "cv_type_unverified" });
  }
  const safeDownloadName = String(app.cv_original_name || safeName)
    .replace(/[^\w.\-()+ ]+/g, "_")
    .slice(0, 180);

  res.setHeader("Content-Type", sniffed);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeDownloadName.replace(/"/g, "")}"`
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("X-Download-Options", "noopen");
  return res.sendFile(filePath);
});

const statusSchema = z.object({
  status: z.enum(["new", "screening", "interview", "offer", "hired", "rejected"]),
  adminNotes: z.string().max(5000).optional(),
  note: z.string().max(1000).optional(),
});

router.patch("/applications/:id/status", requireRole("owner", "hr"), validate(statusSchema), async (req, res) => {
  const app = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!app) return res.status(404).json({ error: "not_found" });
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE applications SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = ? WHERE id = ?"
    ).run(req.body.status, req.body.adminNotes ?? null, now, app.id);
    db.prepare(
      `INSERT INTO application_events (id, application_id, from_status, to_status, note, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuid(),
      app.id,
      app.status,
      req.body.status,
      req.body.note || null,
      now,
      req.admin.id
    );
  });
  tx();

  await notifyApplicationStatus({
    applicationId: app.id,
    toStatus: req.body.status,
    email: app.email,
    phone: app.phone,
    name: app.full_name,
  });

  return res.json({ ok: true, status: req.body.status });
});

router.get("/whatsapp/conversations", requireRole("owner"), (_req, res) => {
  const items = db
    .prepare("SELECT * FROM wa_conversations ORDER BY updated_at DESC LIMIT 100")
    .all();
  return res.json({ items, enabled: config.whatsapp.enabled });
});

router.get("/whatsapp/conversations/:id/messages", requireRole("owner"), (req, res) => {
  const items = db
    .prepare(
      "SELECT * FROM wa_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 500"
    )
    .all(req.params.id);
  return res.json({ items });
});

router.post(
  "/whatsapp/conversations/:id/messages",
  requireRole("owner"),
  validate(z.object({ body: z.string().trim().min(1).max(4000) })),
  async (req, res) => {
    const conversation = db
      .prepare("SELECT * FROM wa_conversations WHERE id = ?")
      .get(req.params.id);
    if (!conversation) return res.status(404).json({ error: "not_found" });
    try {
      await sendWhatsAppText(conversation.wa_id, req.body.body);
      return res.status(201).json({ ok: true });
    } catch (err) {
      return res.status(503).json({ error: err.message });
    }
  }
);

export default router;
