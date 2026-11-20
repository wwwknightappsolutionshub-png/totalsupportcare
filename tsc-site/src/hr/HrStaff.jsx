import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import AdminPageHeader from "../admin/AdminPageHeader";

export default function HrStaff() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_title: "Care Assistant",
  });

  async function load() {
    const d = await api.hrStaff();
    setItems(d.items);
  }

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [toast]);

  useEffect(() => {
    if (!selected) return;
    api.hrStaffDetail(selected).then(setDetail).catch((e) => toast.error(e.message));
  }, [selected, toast]);

  async function createStaff(e) {
    e.preventDefault();
    try {
      const { id } = await api.hrCreateStaff(form);
      toast.success("Staff member created.");
      setShowCreate(false);
      await load();
      setSelected(id);
    } catch (err) {
      toast.error(err.message || "Create failed");
    }
  }

  async function saveStaff(e) {
    e.preventDefault();
    if (!detail?.staff) return;
    const s = detail.staff;
    try {
      await api.hrPatchStaff(s.id, {
        full_name: s.full_name,
        email: s.email,
        phone: s.phone,
        role_title: s.role_title,
        employment_status: s.employment_status,
        contracted_hours: Number(s.contracted_hours) || 0,
        areas: s.areas,
        skills: s.skills,
        availability: s.availability,
        dbs_ref: s.dbs_ref,
        dbs_expiry: s.dbs_expiry,
        right_to_work_note: s.right_to_work_note,
        notes: s.notes,
      });
      toast.success("Staff record saved.");
      await load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  }

  function patchDetail(field, value) {
    setDetail((d) => ({
      ...d,
      staff: { ...d.staff, [field]: value },
    }));
  }

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="People & HR"
        title="Staff files"
        description="Workforce records, DBS, areas, skills, and availability."
        actions={
          <button
            type="button"
            className="admin-btn"
            onClick={() => setShowCreate(true)}
          >
            Add staff
          </button>
        }
      />

      {showCreate ? (
        <form className="hr-card" onSubmit={createStaff}>
          <h2>New staff member</h2>
          <label>
            Full name
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <div className="hr-row-actions">
            <button type="submit" className="hr-btn hr-btn--primary">
              Create
            </button>
            <button type="button" className="hr-btn" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={selected === row.id ? "is-active" : ""}
                  onClick={() => setSelected(row.id)}
                >
                  <td>{row.full_name}</td>
                  <td>{row.role_title}</td>
                  <td>{row.employment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-detail">
          {detail?.staff ? (
            <form onSubmit={saveStaff} className="hr-detail-form">
              <h2>{detail.staff.full_name}</h2>
              <label>
                Employment status
                <select
                  value={detail.staff.employment_status}
                  onChange={(e) => patchDetail("employment_status", e.target.value)}
                >
                  <option value="active">active</option>
                  <option value="probation">probation</option>
                  <option value="suspended">suspended</option>
                  <option value="left">left</option>
                </select>
              </label>
              <label>
                Contracted hours
                <input
                  type="number"
                  value={detail.staff.contracted_hours ?? ""}
                  onChange={(e) =>
                    patchDetail("contracted_hours", e.target.value)
                  }
                />
              </label>
              <label>
                Areas (comma-separated)
                <input
                  value={(detail.staff.areas || []).join(", ")}
                  onChange={(e) =>
                    patchDetail(
                      "areas",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </label>
              <label>
                Skills (comma-separated)
                <input
                  value={(detail.staff.skills || []).join(", ")}
                  onChange={(e) =>
                    patchDetail(
                      "skills",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </label>
              <label>
                DBS reference
                <input
                  value={detail.staff.dbs_ref || ""}
                  onChange={(e) => patchDetail("dbs_ref", e.target.value)}
                />
              </label>
              <label>
                DBS expiry
                <input
                  type="date"
                  value={detail.staff.dbs_expiry || ""}
                  onChange={(e) => patchDetail("dbs_expiry", e.target.value)}
                />
              </label>
              <label>
                Right to work note
                <textarea
                  value={detail.staff.right_to_work_note || ""}
                  onChange={(e) =>
                    patchDetail("right_to_work_note", e.target.value)
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  value={detail.staff.notes || ""}
                  onChange={(e) => patchDetail("notes", e.target.value)}
                />
              </label>
              <button type="submit" className="hr-btn hr-btn--primary">
                Save staff file
              </button>

              <h3>Training</h3>
              <ul className="hr-mini-list">
                {(detail.training || []).map((t) => (
                  <li key={t.course_id || t.id}>
                    <strong>{t.course_name}</strong> — {t.status}
                    {t.expires_at ? ` · expires ${t.expires_at}` : ""}
                  </li>
                ))}
              </ul>
            </form>
          ) : (
            <p>Select a staff member.</p>
          )}
        </div>
      </div>
    </div>
  );
}
