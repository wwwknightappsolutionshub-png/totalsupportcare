import { v4 as uuid } from "uuid";
import { db, nowIso } from "../db/index.js";

export function writeAudit(actor, action, entityType, entityId, detail = null) {
  db.prepare(
    `INSERT INTO hr_audit_log (id, actor_id, actor_email, action, entity_type, entity_id, detail_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuid(),
    actor?.id || null,
    actor?.email || null,
    action,
    entityType,
    entityId || null,
    detail ? JSON.stringify(detail) : null,
    nowIso()
  );
}
