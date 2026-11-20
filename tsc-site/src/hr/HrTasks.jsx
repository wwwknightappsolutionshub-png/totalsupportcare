import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import AdminPageHeader from "../admin/AdminPageHeader";

export default function HrTasks() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "normal",
  });

  async function load() {
    const d = await api.hrTasks(filter || undefined);
    setItems(d.items);
  }

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [filter, toast]);

  async function create(e) {
    e.preventDefault();
    try {
      await api.hrCreateTask({
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
      });
      toast.success("Task created.");
      setForm({ title: "", description: "", due_date: "", priority: "normal" });
      await load();
    } catch (err) {
      toast.error(err.message || "Create failed");
    }
  }

  async function complete(id) {
    try {
      await api.hrPatchTask(id, { status: "done" });
      toast.success("Task completed.");
      await load();
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  }

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="People & HR"
        title="HR tasks"
        description="Reminders for DBS, references, training, and follow-ups."
        actions={
          <select
            className="admin-page-header__select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter tasks"
          >
            <option value="">All (excl. cancelled)</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="cancelled">cancelled</option>
          </select>
        }
      />

      <form className="hr-card" onSubmit={create}>
        <h2>New task</h2>
        <label>
          Title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label>
          Due
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </label>
        <label>
          Priority
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </label>
        <button type="submit" className="hr-btn hr-btn--primary">
          Create task
        </button>
      </form>

      <ul className="hr-task-list">
        {items.map((t) => (
          <li key={t.id} className={`hr-task hr-task--${t.priority}`}>
            <div>
              <strong>{t.title}</strong>
              <p>{t.description}</p>
              <span>
                {t.status}
                {t.due_date ? ` · due ${t.due_date}` : ""}
              </span>
            </div>
            {t.status === "open" || t.status === "in_progress" ? (
              <button
                type="button"
                className="hr-btn hr-btn--small"
                onClick={() => complete(t.id)}
              >
                Complete
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
