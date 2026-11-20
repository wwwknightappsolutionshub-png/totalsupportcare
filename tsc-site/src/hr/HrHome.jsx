import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AdminPageHeader from "../admin/AdminPageHeader";

export default function HrHome() {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    api.hrDashboard().then(setDash).catch(() => setDash(null));
  }, []);

  if (!dash) {
    return (
      <div className="admin-panel">
        <AdminPageHeader
          eyebrow="Human resources"
          title="HR Home"
          description="Loading dashboard…"
        />
      </div>
    );
  }

  const cards = [
    {
      to: "/admin/applications",
      label: "New applications",
      value: dash.newApplications,
      tone: "rose",
    },
    {
      to: "/admin/hr/tasks",
      label: "Open tasks",
      value: dash.openTasks,
      tone: "teal",
    },
    {
      to: "/admin/hr/tasks",
      label: "Overdue tasks",
      value: dash.overdueTasks,
      tone: "ink",
    },
    {
      to: "/admin/hr/staff",
      label: "Active staff",
      value: dash.activeStaff,
      tone: "mist",
    },
    {
      to: "/admin/hr/training",
      label: "Training expiring (30d)",
      value: dash.trainingExpiring30d,
      tone: "rose",
    },
    {
      to: "/admin/hr/staff",
      label: "DBS expiring (60d)",
      value: dash.dbsExpiring60d,
      tone: "ink",
    },
    {
      to: "/admin/applications",
      label: "Onboarding in progress",
      value: dash.onboardingInProgress,
      tone: "teal",
    },
    {
      to: "/admin/hr/absences",
      label: "Absence next 14 days",
      value: dash.absencesNext14d,
      tone: "mist",
    },
  ];

  return (
    <div className="admin-panel admin-overview">
      <AdminPageHeader
        eyebrow="Human resources"
        title="HR Home"
        description="Recruitment, screening, onboarding, workforce compliance, training, absence, and tasks for Total Support Care."
      />

      <ul className="admin-overview__grid">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              to={c.to}
              className={`admin-overview__card admin-overview__card--${c.tone}`}
            >
              <div className="admin-overview__card-top">
                <span className="admin-overview__kicker">Metric</span>
                <span className="admin-overview__stat">
                  <strong>{c.value}</strong>
                </span>
              </div>
              <h2>{c.label}</h2>
              <span className="admin-overview__go">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
