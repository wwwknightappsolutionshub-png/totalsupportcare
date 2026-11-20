// Dev: leave VITE_API_BASE empty to use Vite proxy (same-origin cookies).
// Prod: set VITE_API_BASE to the API host.
// Default empty — cross-origin 127.0.0.1 from localhost drops the session cookie.
const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data?.error || `request_failed_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  base: API_BASE,
  getSettings: () => request("/api/public/settings"),
  getActivePack: () => request("/api/public/pack"),
  getPage: (path) =>
    request(`/api/public/page?path=${encodeURIComponent(path)}`),
  adminPacks: () => request("/api/admin/packs"),
  activatePack: (slug) =>
    request(`/api/admin/packs/${encodeURIComponent(slug)}/activate`, {
      method: "POST",
    }),
  submitContact: (body) =>
    request("/api/public/contact", { method: "POST", body: JSON.stringify(body) }),
  getApplyConfig: () => request("/api/public/apply-config"),
  getFormConfig: () => request("/api/public/form-config"),
  async submitApplication(formData) {
    const res = await fetch(`${API_BASE}/api/public/applications`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(data?.error || `request_failed_${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
  applicationCvUrl: (id) => `${API_BASE}/api/admin/applications/${id}/cv`,
  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  changePassword: (body) =>
    request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  requestPasswordReset: (body) =>
    request("/api/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  resetPassword: (body) =>
    request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminPages: () => request("/api/admin/pages"),
  adminPage: (id) => request(`/api/admin/pages/by-id/${id}`),
  patchPage: (id, body) =>
    request(`/api/admin/pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishPage: (id) =>
    request(`/api/admin/pages/${id}/publish`, { method: "POST" }),
  createPage: (body) =>
    request("/api/admin/pages", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deletePage: (id) =>
    request(`/api/admin/pages/${id}`, { method: "DELETE" }),
  adminSettings: () => request("/api/admin/settings"),
  patchSettings: (body) =>
    request("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  alertsSummary: () => request("/api/admin/alerts/summary"),
  applications: (status) =>
    request(
      `/api/admin/applications${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  application: (id) => request(`/api/admin/applications/${id}`),
  patchApplicationStatus: (id, body) =>
    request(`/api/admin/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  contactMessages: () => request("/api/admin/contact-messages"),
  whatsappConversations: () => request("/api/admin/whatsapp/conversations"),
  whatsappMessages: (id) =>
    request(`/api/admin/whatsapp/conversations/${id}/messages`),
  mediaList: () => request("/api/admin/media"),
  mediaDelete: (id) =>
    request(`/api/admin/media/${id}`, { method: "DELETE" }),
  async mediaUpload(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/admin/media`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(data?.error || `upload_failed_${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
  // ——— HR module ———
  hrDashboard: () => request("/api/hr/dashboard"),
  hrReports: () => request("/api/hr/reports/summary"),
  hrScreening: (id) => request(`/api/hr/applications/${id}/screening`),
  hrPatchScreening: (id, body) =>
    request(`/api/hr/applications/${id}/screening`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  hrOnboarding: (id) => request(`/api/hr/applications/${id}/onboarding`),
  hrPatchOnboarding: (id, body) =>
    request(`/api/hr/applications/${id}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  hrStaff: (status) =>
    request(
      `/api/hr/staff${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  hrStaffDetail: (id) => request(`/api/hr/staff/${id}`),
  hrCreateStaff: (body) =>
    request("/api/hr/staff", { method: "POST", body: JSON.stringify(body) }),
  hrPatchStaff: (id, body) =>
    request(`/api/hr/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  hrCourses: () => request("/api/hr/training/courses"),
  hrTrainingMatrix: () => request("/api/hr/training/matrix"),
  hrPatchTraining: (staffId, courseId, body) =>
    request(`/api/hr/staff/${staffId}/training/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  hrAbsences: (staffId) =>
    request(
      `/api/hr/absences${staffId ? `?staffId=${encodeURIComponent(staffId)}` : ""}`
    ),
  hrCreateAbsence: (body) =>
    request("/api/hr/absences", { method: "POST", body: JSON.stringify(body) }),
  hrPatchAbsence: (id, body) =>
    request(`/api/hr/absences/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  hrTasks: (status) =>
    request(
      `/api/hr/tasks${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  hrCreateTask: (body) =>
    request("/api/hr/tasks", { method: "POST", body: JSON.stringify(body) }),
  hrPatchTask: (id, body) =>
    request(`/api/hr/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  hrComms: (relatedType, relatedId) =>
    request(
      `/api/hr/comms?relatedType=${encodeURIComponent(relatedType)}&relatedId=${encodeURIComponent(relatedId)}`
    ),
  hrCreateComm: (body) =>
    request("/api/hr/comms", { method: "POST", body: JSON.stringify(body) }),
};
