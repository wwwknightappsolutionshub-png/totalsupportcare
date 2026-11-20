import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import AdminPageHeader from "../admin/AdminPageHeader";

export default function HrAbsences() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    staff_id: "",
    kind: "annual_leave",
    start_date: "",
    end_date: "",
    reason: "",
    status: "requested",
  });

  async function load() {
    const [a, s] = await Promise.all([api.hrAbsences(), api.hrStaff("active")]);
    setItems(a.items);
    setStaff(s.items);
    if (!form.staff_id && s.items[0]) {
      setForm((f) => ({ ...f, staff_id: s.items[0].id }));
    }
  }

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  async function create(e) {
    e.preventDefault();
    try {
      await api.hrCreateAbsence(form);
      toast.success("Absence recorded.");
      setForm((f) => ({
        ...f,
        start_date: "",
        end_date: "",
        reason: "",
      }));
      await load();
    } catch (err) {
      toast.error(err.message || "Create failed");
    }
  }

  async function setStatus(id, status) {
    try {
      await api.hrPatchAbsence(id, { status });
      toast.success(`Marked ${status}.`);
      await load();
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  }

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="People & HR"
        title="Absence & leave"
        description="Annual leave, sickness, and other absences with approval trail."
      />

      <form className="hr-card" onSubmit={create}>
        <h2>Record absence</h2>
        <label>
          Staff
          <select
            required
            value={form.staff_id}
            onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
          >
            <option value="annual_leave">annual_leave</option>
            <option value="sickness">sickness</option>
            <option value="unpaid">unpaid</option>
            <option value="other">other</option>
          </select>
        </label>
        <label>
          Start
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </label>
        <label>
          End
          <input
            type="date"
            required
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </label>
        <label>
          Reason
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </label>
        <button type="submit" className="hr-btn hr-btn--primary">
          Save absence
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.full_name}</td>
                <td>{row.kind}</td>
                <td>
                  {row.start_date} → {row.end_date}
                </td>
                <td>{row.status}</td>
                <td className="hr-row-actions">
                  {row.status === "requested" ? (
                    <>
                      <button
                        type="button"
                        className="hr-btn hr-btn--small"
                        onClick={() => setStatus(row.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="hr-btn hr-btn--small"
                        onClick={() => setStatus(row.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
