import { v4 as uuid } from "uuid";
import { db, nowIso } from "../db/index.js";
import { TOTALSUPPORT_PACK } from "../packs/totalsupport.js";
import { ensureSeedMedia } from "./seedMedia.js";

/**
 * Seed / refresh a pack.
 * - New packs: full insert of settings + pages.
 * - Existing packs: merge missing settings keys (admin wins on conflicts),
 *   insert missing pages only. Never overwrite pages that admins have edited
 *   (updated_by IS NOT NULL) unless FORCE_RESEED_PACKS=1.
 */
function upsertPack(pack) {
  const now = nowIso();
  let forceReseed = process.env.FORCE_RESEED_PACKS === "1";
  if (forceReseed && process.env.NODE_ENV === "production") {
    if (process.env.ALLOW_FORCE_RESEED !== "1") {
      console.warn(
        "[packs] FORCE_RESEED_PACKS ignored in production (set ALLOW_FORCE_RESEED=1 to override)"
      );
      forceReseed = false;
    }
  }
  const existing = db
    .prepare("SELECT slug, settings_json, theme_json FROM site_packs WHERE slug = ?")
    .get(pack.slug);

  if (existing) {
    let settings = pack.settings || {};
    let theme = pack.theme || {};
    if (!forceReseed) {
      try {
        const currentSettings = JSON.parse(existing.settings_json || "{}");
        // Seed fills gaps; admin/current values win on key conflicts.
        settings = { ...pack.settings, ...currentSettings };
      } catch {
        settings = pack.settings || {};
      }
      try {
        const currentTheme = JSON.parse(existing.theme_json || "{}");
        theme = { ...pack.theme, ...currentTheme };
      } catch {
        theme = pack.theme || {};
      }
    }
    db.prepare(
      `UPDATE site_packs SET name=?, niche=?, description=?, settings_json=?, theme_json=?,
       preview_image=?, updated_at=? WHERE slug=?`
    ).run(
      pack.name,
      pack.niche,
      pack.description || "",
      JSON.stringify(settings),
      JSON.stringify(theme),
      pack.previewImage || null,
      now,
      pack.slug
    );
  } else {
    db.prepare(
      `INSERT INTO site_packs (slug, name, niche, description, is_active, settings_json, theme_json, preview_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      pack.slug,
      pack.name,
      pack.niche,
      pack.description || "",
      pack.slug === "totalsupport" ? 1 : 0,
      JSON.stringify(pack.settings),
      JSON.stringify(pack.theme),
      pack.previewImage || null,
      now,
      now
    );
  }

  const insertPage = forceReseed
    ? db.prepare(
        `INSERT INTO pack_pages (id, pack_slug, path, title, status, sections_json, draft_sections_json, updated_at, published_at)
         VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?)
         ON CONFLICT(pack_slug, path) DO UPDATE SET
           title = excluded.title,
           sections_json = excluded.sections_json,
           draft_sections_json = excluded.draft_sections_json,
           status = 'published',
           updated_at = excluded.updated_at,
           published_at = excluded.published_at,
           updated_by = NULL`
      )
    : db.prepare(
        `INSERT INTO pack_pages (id, pack_slug, path, title, status, sections_json, draft_sections_json, updated_at, published_at)
         VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?)
         ON CONFLICT(pack_slug, path) DO UPDATE SET
           title = excluded.title,
           sections_json = excluded.sections_json,
           draft_sections_json = excluded.draft_sections_json,
           status = 'published',
           updated_at = excluded.updated_at,
           published_at = excluded.published_at
         WHERE pack_pages.updated_by IS NULL`
      );

  const tx = db.transaction(() => {
    for (const page of pack.pages) {
      const sections = JSON.stringify(page.sections);
      insertPage.run(
        uuid(),
        pack.slug,
        page.path,
        page.title,
        sections,
        sections,
        now,
        now
      );
    }
  });
  tx();
}

/**
 * TSC-only: seed Total Support Care and keep it the sole active pack.
 * Non-TSC packs (kerry / neatly / relocater / clevaro) are removed if present.
 */
export function ensureSitePacks() {
  ensureSeedMedia();
  upsertPack(TOTALSUPPORT_PACK);

  const foreign = db
    .prepare("SELECT slug FROM site_packs WHERE slug != 'totalsupport'")
    .all();
  if (foreign.length) {
    const delPages = db.prepare("DELETE FROM pack_pages WHERE pack_slug = ?");
    const delPack = db.prepare("DELETE FROM site_packs WHERE slug = ?");
    const tx = db.transaction(() => {
      for (const row of foreign) {
        delPages.run(row.slug);
        delPack.run(row.slug);
      }
    });
    tx();
  }

  const active = db
    .prepare("SELECT slug FROM site_packs WHERE is_active = 1")
    .all();
  if (active.length === 0) {
    db.prepare(
      "UPDATE site_packs SET is_active = 1 WHERE slug = 'totalsupport'"
    ).run();
  } else if (active.length > 1 || active[0]?.slug !== "totalsupport") {
    db.prepare("UPDATE site_packs SET is_active = 0").run();
    db.prepare(
      "UPDATE site_packs SET is_active = 1 WHERE slug = 'totalsupport'"
    ).run();
  }
}

export function getActivePack() {
  const row = db
    .prepare("SELECT * FROM site_packs WHERE is_active = 1 LIMIT 1")
    .get();
  if (!row) return null;
  return serializePack(row);
}

export function listPacks() {
  return db
    .prepare("SELECT * FROM site_packs ORDER BY name")
    .all()
    .map(serializePack);
}

export function getPack(slug) {
  const row = db.prepare("SELECT * FROM site_packs WHERE slug = ?").get(slug);
  return row ? serializePack(row) : null;
}

function serializePack(row) {
  return {
    slug: row.slug,
    name: row.name,
    niche: row.niche,
    description: row.description,
    isActive: Boolean(row.is_active),
    settings: JSON.parse(row.settings_json),
    theme: JSON.parse(row.theme_json),
    previewImage: row.preview_image,
    updatedAt: row.updated_at,
  };
}

export function activatePack(slug) {
  const pack = db.prepare("SELECT slug FROM site_packs WHERE slug = ?").get(slug);
  if (!pack) return null;
  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare("UPDATE site_packs SET is_active = 0, updated_at = ?").run(now);
    db.prepare(
      "UPDATE site_packs SET is_active = 1, updated_at = ? WHERE slug = ?"
    ).run(now, slug);
  });
  tx();
  return getActivePack();
}

export function listPackPages(packSlug, { publishedOnly = false } = {}) {
  const sql = publishedOnly
    ? `SELECT id, path, title, status, updated_at, published_at FROM pack_pages
       WHERE pack_slug = ? AND status = 'published' ORDER BY path`
    : `SELECT id, path, title, status, updated_at, published_at FROM pack_pages
       WHERE pack_slug = ? ORDER BY path`;
  return db.prepare(sql).all(packSlug);
}

export function getPackPage(packSlug, path) {
  return db
    .prepare("SELECT * FROM pack_pages WHERE pack_slug = ? AND path = ?")
    .get(packSlug, path);
}

export function getPackPageById(id) {
  return db.prepare("SELECT * FROM pack_pages WHERE id = ?").get(id);
}
