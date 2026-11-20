import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import AdminPageHeader from "../admin/AdminPageHeader";

function StatBlock({ title, entries }) {
  const list = Object.entries(entries || {});
  return (
    <section className="hr-card">
      <h2>{title}</h2>
      {list.length === 0 ? (
        <p className="hr-hint">No data yet.</p>
      ) : (
        <ul className="hr-stat-list">
          {list.map(([k, v]) => (
            <li key={k}>
              <span>{k}</span>
              <strong>{v}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function HrReports() {
  const toast = useToast();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api
      .hrReports()
      .then(setReport)
      .catch((e) => toast.error(e.message));
  }, [toast]);

  if (!report) {
    return (
      <div className="admin-panel">
        <AdminPageHeader
          eyebrow="People & HR"
          title="HR reports"
          description="Loading…"
        />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="People & HR"
        title="HR reports"
        description="Operational snapshot for recruitment, workforce, and compliance."
      />

      <div className="hr-report-grid">
        <StatBlock
          title="Last 30 days"
          entries={report.last30Days || {}}
        />
        <StatBlock
          title="Applications by status"
          entries={report.applicationsByStatus}
        />
        <StatBlock title="Staff by status" entries={report.staffByStatus} />
        <StatBlock
          title="Training by status"
          entries={report.trainingByStatus}
        />
        <StatBlock
          title="Absence by type (90 days)"
          entries={report.absenceByType90d}
        />
        <section className="hr-card">
          <h2>Tasks &amp; compliance</h2>
          <ul className="hr-stat-list">
            <li>
              <span>Open tasks</span>
              <strong>{report.openTasks}</strong>
            </li>
            <li>
              <span>Overdue tasks</span>
              <strong>{report.overdueTasks}</strong>
            </li>
            <li>
              <span>Mandatory training gaps</span>
              <strong>{report.mandatoryTrainingGaps}</strong>
            </li>
            <li>
              <span>Training expiring 30d</span>
              <strong>{report.trainingExpiring30d}</strong>
            </li>
            <li>
              <span>DBS expiring 60d</span>
              <strong>{report.dbsExpiring60d}</strong>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
