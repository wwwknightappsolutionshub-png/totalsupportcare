import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { config } from "../src/config.js";
import { db, nowIso } from "../src/db/index.js";
import { TOTALSUPPORT_PACK } from "../src/packs/totalsupport.js";
import { ensureSitePacks } from "../src/services/packs.js";

const now = nowIso();
const SETTINGS = TOTALSUPPORT_PACK.settings;
const PAGES = TOTALSUPPORT_PACK.pages || [];

const existingAdmin = db
  .prepare("SELECT id FROM admin_users WHERE email = ?")
  .get(config.adminEmail);

if (!existingAdmin) {
  const hash = bcrypt.hashSync(config.adminPassword, 12);
  db.prepare(
    `INSERT INTO admin_users (id, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, 'owner', ?, ?)`
  ).run(uuid(), config.adminEmail, hash, now, now);
  console.log(`Admin created: ${config.adminEmail}`);
} else {
  console.log(`Admin exists: ${config.adminEmail}`);
}

const existingHr = db
  .prepare("SELECT id FROM admin_users WHERE email = ?")
  .get(config.hrEmail);

if (!existingHr) {
  const hrHash = bcrypt.hashSync(config.hrPassword, 12);
  db.prepare(
    `INSERT INTO admin_users (id, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, 'hr', ?, ?)`
  ).run(uuid(), config.hrEmail, hrHash, now, now);
  console.log(`HR created: ${config.hrEmail}`);
} else {
  console.log(`HR exists: ${config.hrEmail}`);
}

db.prepare(
  `INSERT INTO site_settings (id, payload_json, updated_at, updated_by)
   VALUES ('default', ?, ?, NULL)
   ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
).run(JSON.stringify(SETTINGS), now);

const insertPage = db.prepare(
  `INSERT INTO pages (id, path, title, status, sections_json, draft_sections_json, updated_at, published_at)
   VALUES (?, ?, ?, 'published', ?, ?, ?, ?)
   ON CONFLICT(path) DO UPDATE SET
     title = excluded.title,
     sections_json = excluded.sections_json,
     draft_sections_json = excluded.draft_sections_json,
     status = 'published',
     updated_at = excluded.updated_at,
     published_at = excluded.published_at`
);

const tx = db.transaction(() => {
  for (const page of PAGES) {
    const sections = JSON.stringify(page.sections);
    insertPage.run(
      uuid(),
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

const opening = db.prepare("SELECT id FROM job_openings LIMIT 1").get();
if (!opening) {
  db.prepare(
    `INSERT INTO job_openings (id, title, is_active, created_at) VALUES (?, ?, 1, ?)`
  ).run(uuid(), "Care Assistant", now);
}

const COURSES = [
  { name: "Safeguarding Adults", months: 12 },
  { name: "Safeguarding Children", months: 12 },
  { name: "Moving and Handling", months: 12 },
  { name: "Infection Prevention and Control", months: 12 },
  { name: "Medication Awareness", months: 12 },
  { name: "Mental Capacity Act / DoLS Awareness", months: 24 },
  { name: "Fire Safety", months: 12 },
  { name: "Basic Life Support / First Aid", months: 12 },
  { name: "Health and Safety", months: 24 },
  { name: "Equality, Diversity and Inclusion", months: 24 },
];

const insertCourse = db.prepare(
  `INSERT INTO training_courses (id, name, category, validity_months, is_mandatory, created_at)
   VALUES (?, ?, 'mandatory', ?, 1, ?)
   ON CONFLICT(name) DO UPDATE SET validity_months = excluded.validity_months`
);

for (const c of COURSES) {
  insertCourse.run(uuid(), c.name, c.months, now);
}
console.log(`Training courses: ${COURSES.length}`);

ensureSitePacks();
console.log(`Seeded ${PAGES.length} legacy pages + totalsupport pack`);
console.log(`DB: ${config.dbPath}`);
console.log(`HR login: ${config.hrEmail} / (see HR_PASSWORD in .env)`);
