export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'hr')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_throttle (
  key TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS site_packs (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  settings_json TEXT NOT NULL,
  theme_json TEXT NOT NULL,
  preview_image TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  sections_json TEXT NOT NULL,
  draft_sections_json TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS pack_pages (
  id TEXT PRIMARY KEY,
  pack_slug TEXT NOT NULL REFERENCES site_packs(slug) ON DELETE CASCADE,
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  sections_json TEXT NOT NULL,
  draft_sections_json TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  published_at TEXT,
  UNIQUE (pack_slug, path)
);

CREATE TABLE IF NOT EXISTS page_revisions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  sections_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('enquiry', 'candidate')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_openings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  opening_id TEXT REFERENCES job_openings(id),
  contact_id TEXT REFERENCES contacts(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  has_uk_licence INTEGER NOT NULL,
  has_own_vehicle INTEGER NOT NULL,
  has_business_insurance INTEGER NOT NULL,
  care_certificate INTEGER NOT NULL,
  dbs_consent INTEGER NOT NULL,
  notes TEXT,
  cv_filename TEXT,
  cv_original_name TEXT,
  cv_mime TEXT,
  status TEXT NOT NULL CHECK (status IN (
    'new','screening','interview','offer','hired','rejected'
  )),
  admin_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS wa_conversations (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id),
  wa_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wa_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  wa_message_id TEXT,
  status TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_screening (
  application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  right_to_work TEXT NOT NULL DEFAULT 'pending' CHECK (right_to_work IN ('pending','pass','fail','na')),
  dbs_status TEXT NOT NULL DEFAULT 'pending' CHECK (dbs_status IN ('pending','applied','clear','fail','na')),
  dbs_ref TEXT,
  dbs_date TEXT,
  references_status TEXT NOT NULL DEFAULT 'pending' CHECK (references_status IN ('pending','requested','complete','fail','na')),
  interview_score INTEGER,
  interview_notes TEXT,
  licence_verified INTEGER NOT NULL DEFAULT 0,
  vehicle_verified INTEGER NOT NULL DEFAULT 0,
  insurance_verified INTEGER NOT NULL DEFAULT 0,
  care_cert_verified INTEGER NOT NULL DEFAULT 0,
  cleared_to_offer INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS application_onboarding (
  application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'not_started' CHECK (stage IN (
    'not_started','offer_sent','offer_accepted','docs_collected','induction','shadowing','cleared','blocked'
  )),
  offer_sent_at TEXT,
  offer_accepted_at TEXT,
  contract_signed INTEGER NOT NULL DEFAULT 0,
  induction_done INTEGER NOT NULL DEFAULT 0,
  shadow_shifts_done INTEGER NOT NULL DEFAULT 0,
  blocker_note TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS staff_members (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_title TEXT NOT NULL DEFAULT 'Care Assistant',
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','probation','suspended','left')),
  start_date TEXT,
  contracted_hours REAL,
  areas_json TEXT,
  skills_json TEXT,
  availability_json TEXT,
  dbs_ref TEXT,
  dbs_expiry TEXT,
  right_to_work_note TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS staff_documents (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  filename TEXT,
  original_name TEXT,
  mime TEXT,
  notes TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS training_courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'mandatory',
  validity_months INTEGER,
  is_mandatory INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_training (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'required' CHECK (status IN ('required','booked','completed','expired')),
  completed_at TEXT,
  expires_at TEXT,
  certificate_ref TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  UNIQUE (staff_id, course_id)
);

CREATE TABLE IF NOT EXISTS absences (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('annual_leave','sickness','unpaid','other')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  return_to_work_note TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('requested','approved','rejected','cancelled')),
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS hr_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  due_date TEXT,
  related_type TEXT CHECK (related_type IN ('application','staff','absence','training','general')),
  related_id TEXT,
  assignee_id TEXT REFERENCES admin_users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS hr_comms (
  id TEXT PRIMARY KEY,
  related_type TEXT NOT NULL CHECK (related_type IN ('application','staff','contact')),
  related_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('note','email','phone','whatsapp','other')),
  direction TEXT NOT NULL DEFAULT 'internal' CHECK (direction IN ('outbound','inbound','internal')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS hr_audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_path ON pages(path);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation ON wa_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff_members(employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_training_expires ON staff_training(expires_at);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_status ON hr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_absences_staff ON absences(staff_id);
CREATE INDEX IF NOT EXISTS idx_hr_comms_related ON hr_comms(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_hr_audit_created ON hr_audit_log(created_at);
`;
