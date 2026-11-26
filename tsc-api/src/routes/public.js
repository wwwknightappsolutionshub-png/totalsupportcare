import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { config } from "../config.js";
import { db, nowIso } from "../db/index.js";
import { sniffFileMime } from "../lib/fileSniff.js";
import { validate } from "../middleware/validate.js";
import {
  applyFieldsSchema,
  contactSchema,
} from "../schemas/public.js";
import {
  notifyApplicationStatus,
  notifyHrNewApplication,
} from "../services/notify.js";
import { verifyTurnstileToken } from "../services/turnstile.js";
import {
  escapeXmlText,
  isSafePublicPath,
  normalizePublicPath,
} from "../lib/publicPath.js";
import {
  getActivePack,
  getPackPage,
  listPackPages,
} from "../services/packs.js";

const router = Router();

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

const CV_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const CV_EXT = new Set([".pdf", ".doc", ".docx"]);

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.cvsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${uuid()}${ext}`);
  },
});

const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!CV_MIME.has(file.mimetype) || !CV_EXT.has(ext)) {
      return cb(new Error("invalid_cv_type"));
    }
    return cb(null, true);
  },
});

function parseBool(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

router.get("/health", (_req, res) => {
  // Avoid leaking stack/product fingerprints on public health checks
  res.json({ ok: true });
});

function publicFormConfig() {
  return {
    captchaRequired: config.turnstile.enabled,
    turnstileSiteKey: config.turnstile.enabled ? config.turnstile.siteKey : null,
    minSubmitMs: config.applyMinSubmitMs,
    maxAgeMs: config.applyMaxAgeMs,
    maxCvBytes: 5 * 1024 * 1024,
    allowedCvTypes: ["pdf", "doc", "docx"],
  };
}

router.get("/apply-config", (_req, res) => {
  return res.json(publicFormConfig());
});

router.get("/form-config", (_req, res) => {
  return res.json(publicFormConfig());
});

router.get("/settings", (_req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  return res.json({
    ...pack.settings,
    pack: {
      slug: pack.slug,
      name: pack.name,
      niche: pack.niche,
      theme: pack.theme,
    },
    marketplaceEnabled: config.packMarketplaceEnabled,
  });
});

router.get("/pack", (_req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  return res.json({ pack });
});

router.get("/pages", (_req, res) => {
  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });
  const rows = listPackPages(pack.slug, { publishedOnly: true });
  return res.json({
    pack: pack.slug,
    items: rows.map((r) => ({
      path: r.path,
      title: r.title,
      updated_at: r.updated_at,
      published_at: r.published_at,
    })),
  });
});

const TSC_STATIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/news",
  "/opportunities",
  "/contact",
];

/** XML sitemap of active pack published pages. */
router.get("/sitemap.xml", (_req, res) => {
  const configured = (process.env.PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const prodOrigin = config.appOrigins
    .map((o) => o.replace(/\/$/, ""))
    .find(
      (o) =>
        o.startsWith("https://") &&
        !o.includes("localhost") &&
        !o.includes("127.0.0.1") &&
        !o.includes(":5173")
    );
  const site =
    configured || prodOrigin || "https://totalsupportcare.co.uk";

  const pack = getActivePack();
  const rows = pack
    ? listPackPages(pack.slug, { publishedOnly: true })
    : [];

  const byPath = new Map();
  for (const row of rows) {
    const key = row.path === "" ? "/" : row.path;
    if (!isSafePublicPath(key)) continue;
    byPath.set(key, { ...row, path: key });
  }
  for (const path of TSC_STATIC_PATHS) {
    if (!byPath.has(path)) {
      byPath.set(path, { path, updated_at: null, published_at: null });
    }
  }
  const merged = [...byPath.values()].sort((a, b) =>
  a.path.localeCompare(b.path)
  );

  const urls = merged
    .filter((row) => isSafePublicPath(row.path))
    .map((row) => {
      const loc = row.path === "/" ? `${site}/` : `${site}${row.path}`;
      const lastmod = (row.updated_at || row.published_at || "").slice(0, 10);
      return `  <url>
    <loc>${escapeXmlText(loc)}</loc>
    ${lastmod ? `<lastmod>${escapeXmlText(lastmod)}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
  </url>`;
    })
    .join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  );
});

router.get("/page", (req, res) => {
  const pagePath = normalizePublicPath(req.query.path || "/");
  if (!pagePath || !isSafePublicPath(pagePath)) {
    return res.status(400).json({ error: "invalid_path" });
  }

  const pack = getActivePack();
  if (!pack) return res.status(404).json({ error: "not_found" });

  const row = getPackPage(pack.slug, pagePath);
  if (!row || row.status !== "published") {
    return res.status(404).json({ error: "not_found" });
  }
  return res.json({
    id: row.id,
    pack: pack.slug,
    path: row.path,
    title: row.title,
    status: row.status,
    sections: JSON.parse(row.sections_json),
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  });
});

router.post("/contact", formLimiter, validate(contactSchema), async (req, res) => {
  // Honeypot: bots fill hidden "website"
  if (String(req.body.website || "").trim()) {
    return res.status(201).json({ id: uuid(), ok: true });
  }

  const elapsed = Date.now() - Number(req.body.formStartedAt);
  if (
    !Number.isFinite(elapsed) ||
    elapsed < config.applyMinSubmitMs ||
    elapsed > config.applyMaxAgeMs
  ) {
    return res.status(400).json({ error: "submit_timing_invalid" });
  }

  const captcha = await verifyTurnstileToken(
    req.body.captchaToken,
    req.ip
  );
  if (!captcha.ok) {
    return res.status(400).json({ error: captcha.error || "captcha_failed" });
  }

  const now = nowIso();
  const contactId = uuid();
  const messageId = uuid();
  const phone = req.body.phone;

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO contacts (id, kind, name, email, phone, meta_json, created_at)
       VALUES (?, 'enquiry', ?, ?, ?, ?, ?)`
    ).run(
      contactId,
      req.body.name,
      req.body.email,
      phone,
      JSON.stringify({ interest: req.body.interest }),
      now
    );
    db.prepare(
      `INSERT INTO contact_messages
       (id, contact_id, name, email, phone, interest, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
    ).run(
      messageId,
      contactId,
      req.body.name,
      req.body.email,
      phone,
      req.body.interest,
      req.body.message,
      now
    );
  });
  tx();

  return res.status(201).json({ id: messageId, ok: true });
});

router.post("/applications", applyLimiter, (req, res) => {
  cvUpload.single("cv")(req, res, async (err) => {
    if (err) {
      if (err.message === "invalid_cv_type") {
        return res.status(400).json({ error: "invalid_cv_type" });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "cv_too_large" });
      }
      return res.status(400).json({ error: err.message || "upload_failed" });
    }

    const removeCv = () => {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }
      }
    };

    try {
      // Honeypot: bots fill hidden "website"
      if (String(req.body.website || "").trim()) {
        removeCv();
        return res.status(201).json({ id: uuid(), status: "new" });
      }

      let sniffedCvMime = null;
      if (req.file?.path) {
        sniffedCvMime = sniffFileMime(req.file.path, [...CV_MIME]);
        if (!sniffedCvMime) {
          removeCv();
          return res.status(400).json({ error: "invalid_cv_type" });
        }
      }

      const startedAt = Number(req.body.formStartedAt);
      const elapsed = Date.now() - startedAt;
      if (
        !Number.isFinite(startedAt) ||
        elapsed < config.applyMinSubmitMs ||
        elapsed > config.applyMaxAgeMs
      ) {
        removeCv();
        return res.status(400).json({ error: "submit_timing_invalid" });
      }

      const captcha = await verifyTurnstileToken(
        req.body.captchaToken,
        req.ip
      );
      if (!captcha.ok) {
        removeCv();
        return res.status(400).json({ error: captcha.error || "captcha_failed" });
      }

      const parsed = applyFieldsSchema.safeParse({
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        hasUkLicence: parseBool(req.body.hasUkLicence),
        hasOwnVehicle: parseBool(req.body.hasOwnVehicle),
        hasBusinessInsurance: parseBool(req.body.hasBusinessInsurance),
        careCertificate: parseBool(req.body.careCertificate),
        dbsConsent: parseBool(req.body.dbsConsent) ? true : false,
        notes: req.body.notes || "",
        formStartedAt: startedAt,
        website: req.body.website || "",
        captchaToken: req.body.captchaToken || "",
      });

      if (!parsed.success) {
        removeCv();
        return res.status(400).json({
          error: "validation_failed",
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;
      const now = nowIso();
      const opening = db
        .prepare("SELECT id FROM job_openings WHERE is_active = 1 LIMIT 1")
        .get();
      if (!opening) {
        removeCv();
        return res.status(503).json({ error: "no_active_opening" });
      }

      const contactId = uuid();
      const applicationId = uuid();
      const eventId = uuid();

      const tx = db.transaction(() => {
        db.prepare(
          `INSERT INTO contacts (id, kind, name, email, phone, meta_json, created_at)
           VALUES (?, 'candidate', ?, ?, ?, ?, ?)`
        ).run(
          contactId,
          data.fullName,
          data.email,
          data.phone,
          JSON.stringify({ source: "opportunities" }),
          now
        );
        db.prepare(
          `INSERT INTO applications (
            id, opening_id, contact_id, full_name, email, phone,
            has_uk_licence, has_own_vehicle, has_business_insurance, care_certificate, dbs_consent,
            notes, cv_filename, cv_original_name, cv_mime, status, admin_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NULL, ?, ?)`
        ).run(
          applicationId,
          opening.id,
          contactId,
          data.fullName,
          data.email,
          data.phone,
          data.hasUkLicence ? 1 : 0,
          data.hasOwnVehicle ? 1 : 0,
          data.hasBusinessInsurance ? 1 : 0,
          data.careCertificate ? 1 : 0,
          1,
          data.notes || null,
          req.file?.filename || null,
          req.file?.originalname?.slice(0, 200) || null,
          sniffedCvMime,
          now,
          now
        );
        db.prepare(
          `INSERT INTO application_events (id, application_id, from_status, to_status, note, created_at, created_by)
           VALUES (?, ?, NULL, 'new', 'Application submitted', ?, NULL)`
        ).run(eventId, applicationId, now);
        db.prepare(
          `INSERT OR IGNORE INTO application_screening (application_id, updated_at, updated_by)
           VALUES (?, ?, NULL)`
        ).run(applicationId, now);
        db.prepare(
          `INSERT OR IGNORE INTO application_onboarding (application_id, updated_at, updated_by)
           VALUES (?, ?, NULL)`
        ).run(applicationId, now);
      });
      tx();

      await notifyApplicationStatus({
        applicationId,
        toStatus: "new",
        email: data.email,
        phone: data.phone,
        name: data.fullName,
      });

      await notifyHrNewApplication({
        applicationId,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        hasCv: Boolean(req.file),
      });

      return res.status(201).json({
        id: applicationId,
        status: "new",
        hasCv: Boolean(req.file),
      });
    } catch (e) {
      console.error(e);
      removeCv();
      return res.status(500).json({ error: "internal_error" });
    }
  });
});

export default router;
