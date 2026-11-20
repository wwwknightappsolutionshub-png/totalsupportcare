/**
 * Failure-oriented smoke: auth, CMS publish path, contact, application, unauthorized admin.
 */
const BASE = process.env.API_BASE || "http://127.0.0.1:8787";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function req(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  return { res, data, setCookie: raw };
}

function cookieFrom(setCookie) {
  return setCookie
    .flatMap((c) => String(c).split(/,(?=\s*[^;]+=)/))
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

async function main() {
  const health = await req("/api/public/health");
  assert(health.res.ok && health.data.ok, "health failed");

  const settings = await req("/api/public/settings");
  assert(settings.res.ok && settings.data.brandName, "settings failed");

  const page = await req("/api/public/page?path=/about");
  assert(page.res.ok && Array.isArray(page.data.sections), "about page failed");

  const denied = await req("/api/admin/pages");
  assert(denied.res.status === 401, "admin must require auth");

  const badLogin = await req("/api/auth/login", {
    method: "POST",
    body: { email: "admin@kerrycares.co.uk", password: "wrong-password-xx" },
  });
  assert(badLogin.res.status === 401, "bad login should fail");

  const login = await req("/api/auth/login", {
    method: "POST",
    body: {
      email: process.env.ADMIN_EMAIL || "admin@kerrycares.co.uk",
      password: process.env.ADMIN_PASSWORD || "ChangeMeNow!Kerry2026",
    },
  });
  assert(login.res.ok && login.data.user, "login failed");
  const cookie = cookieFrom(login.setCookie);
  assert(cookie.includes("tsc_admin_session"), "session cookie missing");

  const pages = await req("/api/admin/pages", { cookie });
  assert(pages.res.ok && pages.data.items.length >= 6, "admin pages failed");

  const about = pages.data.items.find((p) => p.path === "/about");
  assert(about, "about page missing");
  const detail = await req(`/api/admin/pages/by-id/${about.id}`, { cookie });
  assert(detail.res.ok, "page detail failed");

  const draft = structuredClone(detail.data.draftSections);
  draft[0].fields.title = "About";
  const patched = await req(`/api/admin/pages/${about.id}`, {
    method: "PATCH",
    cookie,
    body: { draftSections: draft },
  });
  assert(patched.res.ok, "patch draft failed");

  const published = await req(`/api/admin/pages/${about.id}/publish`, {
    method: "POST",
    cookie,
  });
  assert(published.res.ok, "publish failed");

  const contact = await req("/api/public/contact", {
    method: "POST",
    body: {
      name: "Smoke Tester",
      email: "smoke@example.com",
      phone: "07000000000",
      interest: "domiciliary",
      message: "E2E smoke enquiry",
    },
  });
  assert(contact.res.status === 201, "contact submit failed");

  const applyForm = new FormData();
  applyForm.set("fullName", "Smoke Candidate");
  applyForm.set("email", "candidate@example.com");
  applyForm.set("phone", "07000000001");
  applyForm.set("hasUkLicence", "true");
  applyForm.set("hasOwnVehicle", "true");
  applyForm.set("hasBusinessInsurance", "true");
  applyForm.set("careCertificate", "true");
  applyForm.set("dbsConsent", "true");
  applyForm.set("notes", "Smoke application");
  applyForm.set("website", "");
  applyForm.set("formStartedAt", String(Date.now() - 5000));
  const applyRes = await fetch(`${BASE}/api/public/applications`, {
    method: "POST",
    body: applyForm,
  });
  const applyText = await applyRes.text();
  let applyData = null;
  try {
    applyData = applyText ? JSON.parse(applyText) : null;
  } catch {
    applyData = applyText;
  }
  assert(applyRes.status === 201, `application failed: ${applyText}`);
  const application = { res: applyRes, data: applyData };

  const apps = await req("/api/admin/applications", { cookie });
  assert(apps.res.ok && apps.data.items.length >= 1, "list applications failed");

  const appId = application.data.id;
  const status = await req(`/api/admin/applications/${appId}/status`, {
    method: "PATCH",
    cookie,
    body: { status: "screening", note: "Smoke move" },
  });
  assert(status.res.ok, "status update failed");

  /* ——— HR module (owner can access) ——— */
  const hrDash = await req("/api/hr/dashboard", { cookie });
  assert(hrDash.res.ok && typeof hrDash.data.newApplications === "number", "hr dashboard failed");

  const screening = await req(`/api/hr/applications/${appId}/screening`, { cookie });
  assert(screening.res.ok && screening.data.screening, "screening get failed");

  const screenPatch = await req(`/api/hr/applications/${appId}/screening`, {
    method: "PATCH",
    cookie,
    body: { right_to_work: "pass", cleared_to_offer: true },
  });
  assert(screenPatch.res.ok, "screening patch failed");

  const onboardPatch = await req(`/api/hr/applications/${appId}/onboarding`, {
    method: "PATCH",
    cookie,
    body: { stage: "cleared", contract_signed: true, induction_done: true },
  });
  assert(onboardPatch.res.ok, "onboarding cleared failed");

  const staffList = await req("/api/hr/staff", { cookie });
  assert(staffList.res.ok && staffList.data.items.length >= 1, "staff list after hire failed");
  const staffId = staffList.data.items[0].id;

  const task = await req("/api/hr/tasks", {
    method: "POST",
    cookie,
    body: { title: "Smoke DBS chase", priority: "high", due_date: "2099-01-01" },
  });
  assert(task.res.status === 201, "task create failed");

  const absence = await req("/api/hr/absences", {
    method: "POST",
    cookie,
    body: {
      staff_id: staffId,
      kind: "annual_leave",
      start_date: "2099-06-01",
      end_date: "2099-06-05",
      status: "requested",
      reason: "Smoke leave",
    },
  });
  assert(absence.res.status === 201, "absence create failed");

  const courses = await req("/api/hr/training/courses", { cookie });
  assert(courses.res.ok && courses.data.items.length >= 5, "training courses missing");

  const reports = await req("/api/hr/reports/summary", { cookie });
  assert(reports.res.ok && reports.data.applicationsByStatus, "hr reports failed");

  const comm = await req("/api/hr/comms", {
    method: "POST",
    cookie,
    body: {
      related_type: "application",
      related_id: appId,
      channel: "note",
      body: "Smoke comms log",
    },
  });
  assert(comm.res.status === 201, "comms create failed");

  /* HR role: can use HR APIs, cannot use CMS */
  const hrLogin = await req("/api/auth/login", {
    method: "POST",
    body: {
      email: process.env.HR_EMAIL || "hr@kerrycares.co.uk",
      password: process.env.HR_PASSWORD || "HrKerry2026!",
    },
  });
  assert(hrLogin.res.ok && hrLogin.data.user.role === "hr", "hr login failed");
  const hrCookie = cookieFrom(hrLogin.setCookie);

  const hrOk = await req("/api/hr/dashboard", { cookie: hrCookie });
  assert(hrOk.res.ok, "hr role dashboard failed");

  const hrCmsDenied = await req("/api/admin/pages", { cookie: hrCookie });
  assert(hrCmsDenied.res.status === 403, "hr must not access CMS pages");

  const hrMediaDenied = await req("/api/admin/media", { cookie: hrCookie });
  assert(hrMediaDenied.res.status === 403, "hr must not access media");

  const waHookForbidden = await req("/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123");
  assert(waHookForbidden.res.status === 403, "whatsapp verify must reject bad token");

  console.log("SMOKE_OK");
}

main().catch((err) => {
  console.error("SMOKE_FAIL", err.message);
  process.exit(1);
});
