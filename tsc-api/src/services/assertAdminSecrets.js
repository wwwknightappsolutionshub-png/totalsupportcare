import bcrypt from "bcryptjs";
import { config } from "../config.js";
import { db } from "../db/index.js";

/**
 * Refuse to boot in production if any admin/HR account still accepts a
 * known default password — catches "env rotated but DB copied from dev".
 */
export function assertNoDefaultAdminPasswords() {
  if (!config.isProd) return;

  const users = db
    .prepare("SELECT id, email, password_hash, role FROM admin_users")
    .all();

  for (const user of users) {
    for (const forbidden of config.forbiddenPasswords) {
      if (bcrypt.compareSync(forbidden, user.password_hash)) {
        throw new Error(
          `Refusing to start: ${user.role} account ${user.email} still uses a default/forbidden password. Rotate via ADMIN_PASSWORD/HR_PASSWORD seed or change-password before production.`
        );
      }
    }
  }
}
