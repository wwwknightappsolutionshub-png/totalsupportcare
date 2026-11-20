import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(root, "..", "data", "kerry.db"));
const row = db
  .prepare("SELECT theme_json FROM site_packs WHERE slug = 'totalsupport'")
  .get();
const theme = JSON.parse(row.theme_json);
theme.fontDisplay = "ITC Avant Garde Gothic";
db.prepare(
  "UPDATE site_packs SET theme_json = ?, updated_at = ? WHERE slug = ?"
).run(JSON.stringify(theme), new Date().toISOString(), "totalsupport");
console.log("fontDisplay=", theme.fontDisplay);
