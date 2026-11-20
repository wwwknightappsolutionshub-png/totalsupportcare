import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { db, nowIso } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { writeAudit } from "../services/audit.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("owner", "hr"));

function ensureScreening(applicationId, actorId) {
  const row = db
    .prepare("SELECT application_id FROM application_screening WHERE application_id = ?")
    .get(applicationId);
  if (!row) {
    db.prepare(
      `INSERT INTO application_screening (application_id, updated_at, updated_by)
       VALUES (?, ?, ?)`
    ).run(applicationId, nowIso(), actorId || null);
  }
}

function ensureOnboarding(applicationId, actorId) {
  const row = db
    .prepare("SELECT application_id FROM application_onboarding WHERE application_id = ?")
    .get(applicationId);
  if (!row) {
    db.prepare(
      `INSERT INTO application_onboarding (application_id, updated_at, updated_by)
       VALUES (?, ?, ?)`
    ).run(applicationId, nowIso(), actorId || null);
  }
}

/* ——— Dashboard / reports ——— */
router.get("/dashboard", (_req, res) => {
  const newApps = db
    .prepare("SELECT COUNT(*) AS c FROM applications WHERE status = 'new'")
    .get().c;
  const pipeline = db
    .prepare(
      `SELECT status, COUNT(*) AS c FROM applications GROUP BY status`
    )
    .all();
  const openTasks = db
    .prepare("SELECT COUNT(*) AS c FROM hr_tasks WHERE status IN ('open','in_progress')")
    .get().c;
  const overdueTasks = db
    .prepare(
      `SELECT COUNT(*) AS c FROM hr_tasks
       WHERE status IN ('open','in_progress') AND due_date IS NOT NULL AND due_date < date('now')`
    )
    .get().c;
  const activeStaff = db
    .prepare(
      "SELECT COUNT(*) AS c FROM staff_members WHERE employment_status IN ('active','probation')"
    )
    .get().c;
  const trainingExpiring = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_training
       WHERE status = 'completed' AND expires_at IS NOT NULL
         AND expires_at <= date('now', '+30 days')`
    )
    .get().c;
  const dbsExpiring = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_members
       WHERE dbs_expiry IS NOT NULL AND dbs_expiry <= date('now', '+60 days')
         AND employment_status IN ('active','probation')`
    )
    .get().c;
  const onboardingActive = db
    .prepare(
      `SELECT COUNT(*) AS c FROM application_onboarding
       WHERE stage NOT IN ('not_started','cleared')`
    )
    .get().c;
  const upcomingAbsence = db
    .prepare(
      `SELECT COUNT(*) AS c FROM absences
       WHERE status = 'approved' AND end_date >= date('now') AND start_date <= date('now', '+14 days')`
    )
    .get().c;

  return res.json({
    newApplications: Number(newApps) || 0,
    pipeline: Object.fromEntries(pipeline.map((r) => [r.status, Number(r.c)])),
    openTasks: Number(openTasks) || 0,
    overdueTasks: Number(overdueTasks) || 0,
    activeStaff: Number(activeStaff) || 0,
    trainingExpiring30d: Number(trainingExpiring) || 0,
    dbsExpiring60d: Number(dbsExpiring) || 0,
    onboardingInProgress: Number(onboardingActive) || 0,
    absencesNext14d: Number(upcomingAbsence) || 0,
  });
});

router.get("/reports/summary", (_req, res) => {
  const starters = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_members
       WHERE start_date IS NOT NULL AND start_date >= date('now', '-30 days')`
    )
    .get().c;
  const leavers = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_members
       WHERE employment_status = 'left' AND updated_at >= datetime('now', '-30 days')`
    )
    .get().c;
  const hired = db
    .prepare(
      `SELECT COUNT(*) AS c FROM applications
       WHERE status = 'hired' AND updated_at >= datetime('now', '-30 days')`
    )
    .get().c;
  const rejected = db
    .prepare(
      `SELECT COUNT(*) AS c FROM applications
       WHERE status = 'rejected' AND updated_at >= datetime('now', '-30 days')`
    )
    .get().c;
  const mandatoryGaps = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_training st
       JOIN training_courses tc ON tc.id = st.course_id
       JOIN staff_members sm ON sm.id = st.staff_id
       WHERE tc.is_mandatory = 1
         AND sm.employment_status IN ('active','probation')
         AND (st.status IN ('required','expired','booked')
              OR (st.status = 'completed' AND st.expires_at IS NOT NULL AND st.expires_at < date('now')))`
    )
    .get().c;
  const applicationsByStatus = Object.fromEntries(
    db
      .prepare(`SELECT status, COUNT(*) AS c FROM applications GROUP BY status`)
      .all()
      .map((r) => [r.status, Number(r.c)])
  );
  const staffByStatus = Object.fromEntries(
    db
      .prepare(
        `SELECT employment_status AS status, COUNT(*) AS c FROM staff_members GROUP BY employment_status`
      )
      .all()
      .map((r) => [r.status, Number(r.c)])
  );
  const trainingByStatus = Object.fromEntries(
    db
      .prepare(
        `SELECT status, COUNT(*) AS c FROM staff_training GROUP BY status`
      )
      .all()
      .map((r) => [r.status, Number(r.c)])
  );
  const absenceByType90d = Object.fromEntries(
    db
      .prepare(
        `SELECT kind, COUNT(*) AS c FROM absences
         WHERE start_date >= date('now', '-90 days') GROUP BY kind`
      )
      .all()
      .map((r) => [r.kind, Number(r.c)])
  );
  const openTasks = db
    .prepare(
      "SELECT COUNT(*) AS c FROM hr_tasks WHERE status IN ('open','in_progress')"
    )
    .get().c;
  const overdueTasks = db
    .prepare(
      `SELECT COUNT(*) AS c FROM hr_tasks
       WHERE status IN ('open','in_progress') AND due_date IS NOT NULL AND due_date < date('now')`
    )
    .get().c;
  const trainingExpiring30d = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_training
       WHERE status = 'completed' AND expires_at IS NOT NULL
         AND expires_at <= date('now', '+30 days')`
    )
    .get().c;
  const dbsExpiring60d = db
    .prepare(
      `SELECT COUNT(*) AS c FROM staff_members
       WHERE dbs_expiry IS NOT NULL AND dbs_expiry <= date('now', '+60 days')
         AND employment_status IN ('active','probation')`
    )
    .get().c;

  return res.json({
    last30Days: {
      starters: Number(starters) || 0,
      leavers: Number(leavers) || 0,
      hired: Number(hired) || 0,
      rejected: Number(rejected) || 0,
    },
    mandatoryTrainingGaps: Number(mandatoryGaps) || 0,
    applicationsByStatus,
    staffByStatus,
    trainingByStatus,
    absenceByType90d,
    openTasks: Number(openTasks) || 0,
    overdueTasks: Number(overdueTasks) || 0,
    trainingExpiring30d: Number(trainingExpiring30d) || 0,
    dbsExpiring60d: Number(dbsExpiring60d) || 0,
  });
});

/* ——— Screening ——— */
router.get("/applications/:id/screening", (req, res) => {
  const app = db.prepare("SELECT id FROM applications WHERE id = ?").get(req.params.id);
  if (!app) return res.status(404).json({ error: "not_found" });
  ensureScreening(req.params.id, req.admin.id);
  const row = db
    .prepare("SELECT * FROM application_screening WHERE application_id = ?")
    .get(req.params.id);
  return res.json({ screening: row });
});

const screeningSchema = z.object({
  right_to_work: z.enum(["pending", "pass", "fail", "na"]).optional(),
  dbs_status: z.enum(["pending", "applied", "clear", "fail", "na"]).optional(),
  dbs_ref: z.string().max(120).optional().nullable(),
  dbs_date: z.string().max(40).optional().nullable(),
  references_status: z
    .enum(["pending", "requested", "complete", "fail", "na"])
    .optional(),
  interview_score: z.number().int().min(0).max(100).optional().nullable(),
  interview_notes: z.string().max(5000).optional().nullable(),
  licence_verified: z.boolean().optional(),
  vehicle_verified: z.boolean().optional(),
  insurance_verified: z.boolean().optional(),
  care_cert_verified: z.boolean().optional(),
  cleared_to_offer: z.boolean().optional(),
});

router.patch(
  "/applications/:id/screening",
  validate(screeningSchema),
  (req, res) => {
    const app = db.prepare("SELECT id FROM applications WHERE id = ?").get(req.params.id);
    if (!app) return res.status(404).json({ error: "not_found" });
    ensureScreening(req.params.id, req.admin.id);
    const cur = db
      .prepare("SELECT * FROM application_screening WHERE application_id = ?")
      .get(req.params.id);
    const next = {
      right_to_work: req.body.right_to_work ?? cur.right_to_work,
      dbs_status: req.body.dbs_status ?? cur.dbs_status,
      dbs_ref: req.body.dbs_ref !== undefined ? req.body.dbs_ref : cur.dbs_ref,
      dbs_date: req.body.dbs_date !== undefined ? req.body.dbs_date : cur.dbs_date,
      references_status: req.body.references_status ?? cur.references_status,
      interview_score:
        req.body.interview_score !== undefined
          ? req.body.interview_score
          : cur.interview_score,
      interview_notes:
        req.body.interview_notes !== undefined
          ? req.body.interview_notes
          : cur.interview_notes,
      licence_verified:
        req.body.licence_verified !== undefined
          ? req.body.licence_verified
            ? 1
            : 0
          : cur.licence_verified,
      vehicle_verified:
        req.body.vehicle_verified !== undefined
          ? req.body.vehicle_verified
            ? 1
            : 0
          : cur.vehicle_verified,
      insurance_verified:
        req.body.insurance_verified !== undefined
          ? req.body.insurance_verified
            ? 1
            : 0
          : cur.insurance_verified,
      care_cert_verified:
        req.body.care_cert_verified !== undefined
          ? req.body.care_cert_verified
            ? 1
            : 0
          : cur.care_cert_verified,
      cleared_to_offer:
        req.body.cleared_to_offer !== undefined
          ? req.body.cleared_to_offer
            ? 1
            : 0
          : cur.cleared_to_offer,
    };
    const now = nowIso();
    db.prepare(
      `UPDATE application_screening SET
        right_to_work=?, dbs_status=?, dbs_ref=?, dbs_date=?, references_status=?,
        interview_score=?, interview_notes=?, licence_verified=?, vehicle_verified=?,
        insurance_verified=?, care_cert_verified=?, cleared_to_offer=?,
        updated_at=?, updated_by=?
       WHERE application_id=?`
    ).run(
      next.right_to_work,
      next.dbs_status,
      next.dbs_ref,
      next.dbs_date,
      next.references_status,
      next.interview_score,
      next.interview_notes,
      next.licence_verified,
      next.vehicle_verified,
      next.insurance_verified,
      next.care_cert_verified,
      next.cleared_to_offer,
      now,
      req.admin.id,
      req.params.id
    );
    writeAudit(req.admin, "screening.update", "application", req.params.id, next);
    const row = db
      .prepare("SELECT * FROM application_screening WHERE application_id = ?")
      .get(req.params.id);
    return res.json({ screening: row });
  }
);

/* ——— Onboarding ——— */
router.get("/applications/:id/onboarding", (req, res) => {
  const app = db.prepare("SELECT id FROM applications WHERE id = ?").get(req.params.id);
  if (!app) return res.status(404).json({ error: "not_found" });
  ensureOnboarding(req.params.id, req.admin.id);
  const row = db
    .prepare("SELECT * FROM application_onboarding WHERE application_id = ?")
    .get(req.params.id);
  return res.json({ onboarding: row });
});

const onboardingSchema = z.object({
  stage: z
    .enum([
      "not_started",
      "offer_sent",
      "offer_accepted",
      "docs_collected",
      "induction",
      "shadowing",
      "cleared",
      "blocked",
    ])
    .optional(),
  offer_sent_at: z.string().max(40).optional().nullable(),
  offer_accepted_at: z.string().max(40).optional().nullable(),
  contract_signed: z.boolean().optional(),
  induction_done: z.boolean().optional(),
  shadow_shifts_done: z.boolean().optional(),
  blocker_note: z.string().max(2000).optional().nullable(),
});

router.patch(
  "/applications/:id/onboarding",
  validate(onboardingSchema),
  (req, res) => {
    const app = db
      .prepare("SELECT id, full_name, email, phone, status FROM applications WHERE id = ?")
      .get(req.params.id);
    if (!app) return res.status(404).json({ error: "not_found" });
    ensureOnboarding(req.params.id, req.admin.id);
    const cur = db
      .prepare("SELECT * FROM application_onboarding WHERE application_id = ?")
      .get(req.params.id);
    const now = nowIso();
    const stage = req.body.stage ?? cur.stage;
    const contract_signed =
      req.body.contract_signed !== undefined
        ? req.body.contract_signed
          ? 1
          : 0
        : cur.contract_signed;
    const induction_done =
      req.body.induction_done !== undefined
        ? req.body.induction_done
          ? 1
          : 0
        : cur.induction_done;
    const shadow_shifts_done =
      req.body.shadow_shifts_done !== undefined
        ? req.body.shadow_shifts_done
          ? 1
          : 0
        : cur.shadow_shifts_done;

    db.prepare(
      `UPDATE application_onboarding SET
        stage=?, offer_sent_at=COALESCE(?, offer_sent_at), offer_accepted_at=COALESCE(?, offer_accepted_at),
        contract_signed=?, induction_done=?, shadow_shifts_done=?, blocker_note=?,
        updated_at=?, updated_by=?
       WHERE application_id=?`
    ).run(
      stage,
      req.body.offer_sent_at !== undefined ? req.body.offer_sent_at : null,
      req.body.offer_accepted_at !== undefined ? req.body.offer_accepted_at : null,
      contract_signed,
      induction_done,
      shadow_shifts_done,
      req.body.blocker_note !== undefined ? req.body.blocker_note : cur.blocker_note,
      now,
      req.admin.id,
      req.params.id
    );

    // Promote to staff when cleared and hired
    if (stage === "cleared") {
      const existing = db
        .prepare("SELECT id FROM staff_members WHERE application_id = ?")
        .get(req.params.id);
      if (!existing) {
        const staffId = uuid();
        db.prepare(
          `INSERT INTO staff_members (
            id, application_id, full_name, email, phone, role_title, employment_status,
            start_date, contracted_hours, areas_json, skills_json, availability_json,
            notes, created_at, updated_at, created_by
          ) VALUES (?, ?, ?, ?, ?, 'Care Assistant', 'probation', ?, 30, ?, ?, ?, NULL, ?, ?, ?)`
        ).run(
          staffId,
          req.params.id,
          app.full_name,
          app.email,
          app.phone,
          now.slice(0, 10),
          JSON.stringify(["Coventry", "Nuneaton", "Hinckley"]),
          JSON.stringify(["domiciliary"]),
          JSON.stringify({ mon: true, tue: true, wed: true, thu: true, fri: true }),
          now,
          now,
          req.admin.id
        );
        // Assign mandatory training
        const courses = db.prepare("SELECT id FROM training_courses WHERE is_mandatory = 1").all();
        const ins = db.prepare(
          `INSERT OR IGNORE INTO staff_training (id, staff_id, course_id, status, updated_at, updated_by)
           VALUES (?, ?, ?, 'required', ?, ?)`
        );
        for (const c of courses) {
          ins.run(uuid(), staffId, c.id, now, req.admin.id);
        }
        if (app.status !== "hired") {
          db.prepare(
            "UPDATE applications SET status = 'hired', updated_at = ? WHERE id = ?"
          ).run(now, req.params.id);
        }
        writeAudit(req.admin, "staff.create_from_onboarding", "staff", staffId, {
          applicationId: req.params.id,
        });
      }
    }

    writeAudit(req.admin, "onboarding.update", "application", req.params.id, {
      stage,
    });
    const row = db
      .prepare("SELECT * FROM application_onboarding WHERE application_id = ?")
      .get(req.params.id);
    return res.json({ onboarding: row });
  }
);

/* ——— Staff ——— */
router.get("/staff", (req, res) => {
  const status = req.query.status;
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM staff_members WHERE employment_status = ? ORDER BY full_name"
        )
        .all(String(status))
    : db.prepare("SELECT * FROM staff_members ORDER BY full_name").all();
  return res.json({
    items: rows.map((r) => ({
      ...r,
      areas: JSON.parse(r.areas_json || "[]"),
      skills: JSON.parse(r.skills_json || "[]"),
      availability: JSON.parse(r.availability_json || "{}"),
    })),
  });
});

router.get("/staff/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM staff_members WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not_found" });
  const docs = db
    .prepare(
      "SELECT id, doc_type, title, original_name, expires_at, created_at FROM staff_documents WHERE staff_id = ? ORDER BY created_at DESC"
    )
    .all(req.params.id);
  const training = db
    .prepare(
      `SELECT st.*, tc.name AS course_name, tc.category, tc.is_mandatory
       FROM staff_training st JOIN training_courses tc ON tc.id = st.course_id
       WHERE st.staff_id = ? ORDER BY tc.name`
    )
    .all(req.params.id);
  return res.json({
    staff: {
      ...row,
      areas: JSON.parse(row.areas_json || "[]"),
      skills: JSON.parse(row.skills_json || "[]"),
      availability: JSON.parse(row.availability_json || "{}"),
    },
    documents: docs,
    training,
  });
});

const staffSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional().nullable(),
  role_title: z.string().max(120).optional(),
  employment_status: z
    .enum(["active", "probation", "suspended", "left"])
    .optional(),
  start_date: z.string().max(40).optional().nullable(),
  contracted_hours: z.number().min(0).max(80).optional().nullable(),
  areas: z.array(z.string().max(80)).max(20).optional(),
  skills: z.array(z.string().max(80)).max(30).optional(),
  availability: z.record(z.boolean()).optional(),
  dbs_ref: z.string().max(120).optional().nullable(),
  dbs_expiry: z.string().max(40).optional().nullable(),
  right_to_work_note: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

router.patch("/staff/:id", validate(staffSchema), (req, res) => {
  const row = db.prepare("SELECT * FROM staff_members WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not_found" });
  const now = nowIso();
  const areas =
    req.body.areas !== undefined
      ? JSON.stringify(req.body.areas)
      : row.areas_json;
  const skills =
    req.body.skills !== undefined
      ? JSON.stringify(req.body.skills)
      : row.skills_json;
  const availability =
    req.body.availability !== undefined
      ? JSON.stringify(req.body.availability)
      : row.availability_json;

  db.prepare(
    `UPDATE staff_members SET
      full_name=COALESCE(?, full_name),
      email=COALESCE(?, email),
      phone=COALESCE(?, phone),
      role_title=COALESCE(?, role_title),
      employment_status=COALESCE(?, employment_status),
      start_date=COALESCE(?, start_date),
      contracted_hours=COALESCE(?, contracted_hours),
      areas_json=?, skills_json=?, availability_json=?,
      dbs_ref=COALESCE(?, dbs_ref),
      dbs_expiry=COALESCE(?, dbs_expiry),
      right_to_work_note=COALESCE(?, right_to_work_note),
      notes=COALESCE(?, notes),
      updated_at=?
     WHERE id=?`
  ).run(
    req.body.full_name ?? null,
    req.body.email ?? null,
    req.body.phone !== undefined ? req.body.phone : null,
    req.body.role_title ?? null,
    req.body.employment_status ?? null,
    req.body.start_date !== undefined ? req.body.start_date : null,
    req.body.contracted_hours !== undefined ? req.body.contracted_hours : null,
    areas,
    skills,
    availability,
    req.body.dbs_ref !== undefined ? req.body.dbs_ref : null,
    req.body.dbs_expiry !== undefined ? req.body.dbs_expiry : null,
    req.body.right_to_work_note !== undefined ? req.body.right_to_work_note : null,
    req.body.notes !== undefined ? req.body.notes : null,
    now,
    req.params.id
  );
  writeAudit(req.admin, "staff.update", "staff", req.params.id, req.body);
  const updated = db.prepare("SELECT * FROM staff_members WHERE id = ?").get(req.params.id);
  return res.json({
    staff: {
      ...updated,
      areas: JSON.parse(updated.areas_json || "[]"),
      skills: JSON.parse(updated.skills_json || "[]"),
      availability: JSON.parse(updated.availability_json || "{}"),
    },
  });
});

const staffCreateSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  role_title: z.string().max(120).default("Care Assistant"),
  start_date: z.string().max(40).optional(),
  contracted_hours: z.number().min(0).max(80).optional(),
});

router.post("/staff", validate(staffCreateSchema), (req, res) => {
  const id = uuid();
  const now = nowIso();
  db.prepare(
    `INSERT INTO staff_members (
      id, application_id, full_name, email, phone, role_title, employment_status,
      start_date, contracted_hours, areas_json, skills_json, availability_json,
      created_at, updated_at, created_by
    ) VALUES (?, NULL, ?, ?, ?, ?, 'active', ?, ?, '[]', '[]', '{}', ?, ?, ?)`
  ).run(
    id,
    req.body.full_name,
    req.body.email,
    req.body.phone || null,
    req.body.role_title || "Care Assistant",
    req.body.start_date || now.slice(0, 10),
    req.body.contracted_hours ?? 30,
    now,
    now,
    req.admin.id
  );
  const courses = db.prepare("SELECT id FROM training_courses WHERE is_mandatory = 1").all();
  const ins = db.prepare(
    `INSERT OR IGNORE INTO staff_training (id, staff_id, course_id, status, updated_at, updated_by)
     VALUES (?, ?, ?, 'required', ?, ?)`
  );
  for (const c of courses) ins.run(uuid(), id, c.id, now, req.admin.id);
  writeAudit(req.admin, "staff.create", "staff", id, req.body);
  return res.status(201).json({ id });
});

/* ——— Training catalogue + assignments ——— */
router.get("/training/courses", (_req, res) => {
  const items = db
    .prepare("SELECT * FROM training_courses ORDER BY is_mandatory DESC, name")
    .all();
  return res.json({ items });
});

router.get("/training/matrix", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT sm.id AS staff_id, sm.full_name, sm.employment_status,
              tc.id AS course_id, tc.name AS course_name, tc.is_mandatory,
              st.status, st.expires_at, st.completed_at
       FROM staff_members sm
       CROSS JOIN training_courses tc
       LEFT JOIN staff_training st ON st.staff_id = sm.id AND st.course_id = tc.id
       WHERE sm.employment_status IN ('active','probation')
       ORDER BY sm.full_name, tc.name`
    )
    .all();
  return res.json({ items: rows });
});

const trainingPatchSchema = z.object({
  status: z.enum(["required", "booked", "completed", "expired"]),
  completed_at: z.string().max(40).optional().nullable(),
  expires_at: z.string().max(40).optional().nullable(),
  certificate_ref: z.string().max(200).optional().nullable(),
});

router.patch(
  "/staff/:staffId/training/:courseId",
  validate(trainingPatchSchema),
  (req, res) => {
    const staff = db
      .prepare("SELECT id FROM staff_members WHERE id = ?")
      .get(req.params.staffId);
    const course = db
      .prepare("SELECT id, validity_months FROM training_courses WHERE id = ?")
      .get(req.params.courseId);
    if (!staff || !course) return res.status(404).json({ error: "not_found" });
    const now = nowIso();
    let expires = req.body.expires_at ?? null;
    if (req.body.status === "completed" && !expires && course.validity_months) {
      const d = new Date();
      d.setMonth(d.getMonth() + course.validity_months);
      expires = d.toISOString().slice(0, 10);
    }
    const existing = db
      .prepare(
        "SELECT id FROM staff_training WHERE staff_id = ? AND course_id = ?"
      )
      .get(req.params.staffId, req.params.courseId);
    if (existing) {
      db.prepare(
        `UPDATE staff_training SET status=?, completed_at=?, expires_at=?, certificate_ref=?,
         updated_at=?, updated_by=? WHERE id=?`
      ).run(
        req.body.status,
        req.body.completed_at ??
          (req.body.status === "completed" ? now.slice(0, 10) : null),
        expires,
        req.body.certificate_ref ?? null,
        now,
        req.admin.id,
        existing.id
      );
    } else {
      db.prepare(
        `INSERT INTO staff_training (id, staff_id, course_id, status, completed_at, expires_at, certificate_ref, updated_at, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uuid(),
        req.params.staffId,
        req.params.courseId,
        req.body.status,
        req.body.completed_at ??
          (req.body.status === "completed" ? now.slice(0, 10) : null),
        expires,
        req.body.certificate_ref ?? null,
        now,
        req.admin.id
      );
    }
    writeAudit(req.admin, "training.update", "staff", req.params.staffId, {
      courseId: req.params.courseId,
      ...req.body,
    });
    return res.json({ ok: true });
  }
);

/* ——— Absences ——— */
router.get("/absences", (req, res) => {
  const staffId = req.query.staffId;
  const rows = staffId
    ? db
        .prepare(
          `SELECT a.*, s.full_name FROM absences a
           JOIN staff_members s ON s.id = a.staff_id
           WHERE a.staff_id = ? ORDER BY a.start_date DESC`
        )
        .all(String(staffId))
    : db
        .prepare(
          `SELECT a.*, s.full_name FROM absences a
           JOIN staff_members s ON s.id = a.staff_id
           ORDER BY a.start_date DESC LIMIT 300`
        )
        .all();
  return res.json({ items: rows });
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date")
  .max(10);

const absenceSchema = z.object({
  staff_id: z.string().uuid(),
  kind: z.enum(["annual_leave", "sickness", "unpaid", "other"]),
  start_date: isoDate,
  end_date: isoDate,
  reason: z.string().max(2000).optional().nullable(),
  return_to_work_note: z.string().max(2000).optional().nullable(),
  status: z.enum(["requested", "approved", "rejected", "cancelled"]).default("approved"),
});

router.post("/absences", validate(absenceSchema), (req, res) => {
  const staff = db
    .prepare("SELECT id FROM staff_members WHERE id = ?")
    .get(req.body.staff_id);
  if (!staff) return res.status(404).json({ error: "staff_not_found" });
  if (req.body.end_date < req.body.start_date) {
    return res.status(400).json({ error: "invalid_date_range" });
  }
  const id = uuid();
  db.prepare(
    `INSERT INTO absences (id, staff_id, kind, start_date, end_date, reason, return_to_work_note, status, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.body.staff_id,
    req.body.kind,
    req.body.start_date,
    req.body.end_date,
    req.body.reason || null,
    req.body.return_to_work_note || null,
    req.body.status || "approved",
    nowIso(),
    req.admin.id
  );
  writeAudit(req.admin, "absence.create", "absence", id, req.body);
  return res.status(201).json({ id });
});

router.patch(
  "/absences/:id",
  validate(
    z.object({
      status: z.enum(["requested", "approved", "rejected", "cancelled"]).optional(),
      return_to_work_note: z.string().max(2000).optional().nullable(),
      reason: z.string().max(2000).optional().nullable(),
    })
  ),
  (req, res) => {
    const row = db.prepare("SELECT id FROM absences WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "not_found" });
    db.prepare(
      `UPDATE absences SET
        status=COALESCE(?, status),
        return_to_work_note=COALESCE(?, return_to_work_note),
        reason=COALESCE(?, reason)
       WHERE id=?`
    ).run(
      req.body.status ?? null,
      req.body.return_to_work_note !== undefined ? req.body.return_to_work_note : null,
      req.body.reason !== undefined ? req.body.reason : null,
      req.params.id
    );
    writeAudit(req.admin, "absence.update", "absence", req.params.id, req.body);
    return res.json({ ok: true });
  }
);

/* ——— Tasks ——— */
router.get("/tasks", (req, res) => {
  const status = req.query.status;
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM hr_tasks WHERE status = ? ORDER BY due_date IS NULL, due_date, created_at DESC"
        )
        .all(String(status))
    : db
        .prepare(
          "SELECT * FROM hr_tasks WHERE status != 'cancelled' ORDER BY due_date IS NULL, due_date, created_at DESC LIMIT 300"
        )
        .all();
  return res.json({ items: rows });
});

const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  due_date: z.string().max(40).optional().nullable(),
  related_type: z
    .enum(["application", "staff", "absence", "training", "general"])
    .optional()
    .nullable(),
  related_id: z.string().max(80).optional().nullable(),
});

router.post("/tasks", validate(taskSchema), (req, res) => {
  const id = uuid();
  const now = nowIso();
  db.prepare(
    `INSERT INTO hr_tasks (id, title, description, status, priority, due_date, related_type, related_id, assignee_id, created_at, updated_at, created_by)
     VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.body.title,
    req.body.description || null,
    req.body.priority || "normal",
    req.body.due_date || null,
    req.body.related_type || "general",
    req.body.related_id || null,
    req.admin.id,
    now,
    now,
    req.admin.id
  );
  writeAudit(req.admin, "task.create", "task", id, req.body);
  return res.status(201).json({ id });
});

router.patch(
  "/tasks/:id",
  validate(
    z.object({
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(5000).optional().nullable(),
      status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      due_date: z.string().max(40).optional().nullable(),
    })
  ),
  (req, res) => {
    const row = db.prepare("SELECT * FROM hr_tasks WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "not_found" });
    db.prepare(
      `UPDATE hr_tasks SET
        title=COALESCE(?, title),
        description=COALESCE(?, description),
        status=COALESCE(?, status),
        priority=COALESCE(?, priority),
        due_date=COALESCE(?, due_date),
        updated_at=?
       WHERE id=?`
    ).run(
      req.body.title ?? null,
      req.body.description !== undefined ? req.body.description : null,
      req.body.status ?? null,
      req.body.priority ?? null,
      req.body.due_date !== undefined ? req.body.due_date : null,
      nowIso(),
      req.params.id
    );
    writeAudit(req.admin, "task.update", "task", req.params.id, req.body);
    return res.json({ ok: true });
  }
);

/* ——— Communications log ——— */
router.get("/comms", (req, res) => {
  const { relatedType, relatedId } = req.query;
  if (!relatedType || !relatedId) {
    return res.status(400).json({ error: "relatedType_and_relatedId_required" });
  }
  const items = db
    .prepare(
      `SELECT * FROM hr_comms WHERE related_type = ? AND related_id = ?
       ORDER BY created_at DESC LIMIT 200`
    )
    .all(String(relatedType), String(relatedId));
  return res.json({ items });
});

const commsSchema = z.object({
  related_type: z.enum(["application", "staff", "contact"]),
  related_id: z.string().min(1).max(80),
  channel: z.enum(["note", "email", "phone", "whatsapp", "other"]),
  direction: z.enum(["outbound", "inbound", "internal"]).default("internal"),
  subject: z.string().max(300).optional().nullable(),
  body: z.string().min(1).max(10000),
});

router.post("/comms", validate(commsSchema), (req, res) => {
  const id = uuid();
  db.prepare(
    `INSERT INTO hr_comms (id, related_type, related_id, channel, direction, subject, body, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.body.related_type,
    req.body.related_id,
    req.body.channel,
    req.body.direction || "internal",
    req.body.subject || null,
    req.body.body,
    nowIso(),
    req.admin.id
  );
  writeAudit(req.admin, "comms.create", "comms", id, {
    related_type: req.body.related_type,
    related_id: req.body.related_id,
  });
  return res.status(201).json({ id });
});

export default router;
