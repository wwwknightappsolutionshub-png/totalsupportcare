import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import AdminPageHeader from "../admin/AdminPageHeader";

export default function HrTraining() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    status: "required",
    completed_at: "",
    expires_at: "",
    certificate_ref: "",
  });

  async function load() {
    const [c, m] = await Promise.all([
      api.hrCourses(),
      api.hrTrainingMatrix(),
    ]);
    setCourses(c.items);
    setMatrix(m.items);
  }

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [toast]);

  function openEdit(row) {
    setEditing(row);
    setForm({
      status: row.status || "required",
      completed_at: row.completed_at || "",
      expires_at: row.expires_at || "",
      certificate_ref: row.certificate_ref || "",
    });
  }

  async function save(e) {
    e.preventDefault();
    try {
      await api.hrPatchTraining(editing.staff_id, editing.course_id, form);
      toast.success("Training record updated.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  }

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="People & HR"
        title="Training & compliance"
        description="Mandatory courses, expiry tracking, and certificates."
      />

      <section className="hr-card">
        <h2>Course catalogue</h2>
        <ul className="hr-mini-list">
          {courses.map((c) => (
            <li key={c.id}>
              <strong>{c.name}</strong>
              {c.is_mandatory ? " · mandatory" : ""}
              {c.validity_months
                ? ` · valid ${c.validity_months} months`
                : ""}
            </li>
          ))}
        </ul>
      </section>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Course</th>
              <th>Status</th>
              <th>Expires</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={`${row.staff_id}-${row.course_id}`}>
                <td>{row.full_name}</td>
                <td>
                  {row.course_name}
                  {row.is_mandatory ? " *" : ""}
                </td>
                <td>
                  <span
                    className={`hr-pill hr-pill--${row.status || "required"}`}
                  >
                    {row.status || "not assigned"}
                  </span>
                </td>
                <td>{row.expires_at || "—"}</td>
                <td>
                  <button
                    type="button"
                    className="hr-btn hr-btn--small"
                    onClick={() => openEdit(row)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <form className="hr-card hr-modal-card" onSubmit={save}>
          <h2>
            {editing.full_name} · {editing.course_name}
          </h2>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="required">required</option>
              <option value="booked">booked</option>
              <option value="completed">completed</option>
              <option value="expired">expired</option>
            </select>
          </label>
          <label>
            Completed
            <input
              type="date"
              value={form.completed_at}
              onChange={(e) =>
                setForm({ ...form, completed_at: e.target.value })
              }
            />
          </label>
          <label>
            Expires
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) =>
                setForm({ ...form, expires_at: e.target.value })
              }
            />
          </label>
          <label>
            Certificate ref
            <input
              value={form.certificate_ref}
              onChange={(e) =>
                setForm({ ...form, certificate_ref: e.target.value })
              }
            />
          </label>
          <div className="hr-row-actions">
            <button type="submit" className="hr-btn hr-btn--primary">
              Save
            </button>
            <button
              type="button"
              className="hr-btn"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
