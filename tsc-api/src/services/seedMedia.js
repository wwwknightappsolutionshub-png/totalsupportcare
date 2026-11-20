import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { db, nowIso } from "../db/index.js";
import { sniffFileMime } from "../lib/fileSniff.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, "..", "..", "seed-media");

/** Stable filenames so CMS seed URLs stay deterministic across reseeds. */
export const SEED_MEDIA = {
  hero: "seed-hero.jpg",
  about: "seed-svc-domiciliary.jpg",
  services: "seed-support.jpg",
  community: "seed-svc-community.jpg",
  dementia: "seed-svc-dementia.jpg",
  elderly: "seed-svc-elderly.jpg",
  eol: "seed-svc-eol.jpg",
  support: "seed-svc-support.jpg",
  hiring: "seed-hiring-interview.jpg",
};

const SOURCE_FILES = {
  [SEED_MEDIA.hero]: "svc-community.jpg",
  [SEED_MEDIA.about]: "svc-domiciliary.jpg",
  [SEED_MEDIA.services]: "support.jpg",
  [SEED_MEDIA.community]: "svc-community.jpg",
  [SEED_MEDIA.dementia]: "svc-dementia.jpg",
  [SEED_MEDIA.elderly]: "svc-elderly.jpg",
  [SEED_MEDIA.eol]: "svc-eol.jpg",
  [SEED_MEDIA.support]: "svc-support.jpg",
  [SEED_MEDIA.hiring]: "hiring-interview.jpg",
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function mediaUrl(filename) {
  return `/uploads/${filename}`;
}

/**
 * Copy packaged seed images into uploads/ and register rows in media.
 * Idempotent: skips files that already exist with a matching media row.
 */
export function ensureSeedMedia() {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  if (!fs.existsSync(SEED_DIR)) {
    console.warn("seed-media folder missing:", SEED_DIR);
    return { imported: 0, urls: {} };
  }

  const now = nowIso();
  let imported = 0;
  const urls = {};

  const insert = db.prepare(
    `INSERT INTO media (id, filename, original_name, mime, size, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       filename = excluded.filename,
       original_name = excluded.original_name,
       mime = excluded.mime,
       size = excluded.size`
  );

  for (const [destName, sourceName] of Object.entries(SOURCE_FILES)) {
    const src = path.join(SEED_DIR, sourceName);
    const dest = path.join(config.uploadsDir, destName);
    urls[destName] = mediaUrl(destName);

    if (!fs.existsSync(src)) {
      console.warn("seed media source missing:", sourceName);
      continue;
    }

    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }

    const sniffed = sniffFileMime(dest, ALLOWED);
    if (!sniffed) {
      console.warn("seed media failed sniff:", destName);
      continue;
    }

    const stat = fs.statSync(dest);
    const id = `seed:${destName}`;
    insert.run(id, destName, sourceName, sniffed, stat.size, now, "system");
    imported += 1;
  }

  return { imported, urls };
}

export function seedMediaUrl(key) {
  const filename = SEED_MEDIA[key];
  if (!filename) return "";
  return mediaUrl(filename);
}
