import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { useAdminAlerts } from "./AdminAlertsContext";
import AdminPageHeader from "./AdminPageHeader";

const STATUSES = [
  "new",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const ONBOARDING_STAGES = [
  "not_started",
  "offer_sent",
  "offer_accepted",
  "docs_collected",
  "induction",
  "shadowing",
  "cleared",
  "blocked",
];

export default function AdminApplications() {
  const toast = useToast();
  const { applicationFeedTick, refreshAlerts } = useAdminAlerts();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("new");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("pipeline");
  const [screening, setScreening] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [comms, setComms] = useState([]);
  const [commBody, setCommBody] = useState("");
  const [commChannel, setCommChannel] = useState("note");

  async function load() {
    const data = await api.applications();
    setItems(data.items);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (applicationFeedTick > 0) {
      load();
    }
  }, [applicationFeedTick]);

  useEffect(() => {
    if (!selected) return;
    api.application(selected).then((d) => {
      setDetail(d);
      setStatus(d.application.status);
    });
    api.hrScreening(selected).then((d) => setScreening(d.screening));
    api.hrOnboarding(selected).then((d) => setOnboarding(d.onboarding));
    api.hrComms("application", selected).then((d) => setComms(d.items));
  }, [selected]);

  async function updateStatus() {
    try {
      await api.patchApplicationStatus(selected, { status, note });
      const d = await api.application(selected);
      setDetail(d);
      await load();
      await refreshAlerts();
      toast.success(`Status updated to ${status}. Candidate notified.`);
    } catch (err) {
      toast.error(err.message || "Could not update status");
    }
  }

  async function saveScreening(e) {
    e.preventDefault();
    try {
      const d = await api.hrPatchScreening(selected, {
        right_to_work: screening.right_to_work,
        dbs_status: screening.dbs_status,
        dbs_ref: screening.dbs_ref,
        dbs_date: screening.dbs_date,
        references_status: screening.references_status,
        interview_score: screening.interview_score
          ? Number(screening.interview_score)
          : null,
        interview_notes: screening.interview_notes,
        licence_verified: Boolean(screening.licence_verified),
        vehicle_verified: Boolean(screening.vehicle_verified),
        insurance_verified: Boolean(screening.insurance_verified),
        care_cert_verified: Boolean(screening.care_cert_verified),
        cleared_to_offer: Boolean(screening.cleared_to_offer),
      });
      setScreening(d.screening);
      toast.success("Screening checklist saved.");
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  }

  async function saveOnboarding(e) {
    e.preventDefault();
    try {
      const d = await api.hrPatchOnboarding(selected, {
        stage: onboarding.stage,
        contract_signed: Boolean(onboarding.contract_signed),
        induction_done: Boolean(onboarding.induction_done),
        shadow_shifts_done: Boolean(onboarding.shadow_shifts_done),
        blocker_note: onboarding.blocker_note,
      });
      setOnboarding(d.onboarding);
      toast.success(
        d.onboarding.stage === "cleared"
          ? "Onboarding cleared — staff file created if needed."
          : "Onboarding updated."
      );
      await load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  }

  async function addComm(e) {
    e.preventDefault();
    try {
      await api.hrCreateComm({
        related_type: "application",
        related_id: selected,
        channel: commChannel,
        direction: "internal",
        body: commBody,
      });
      setCommBody("");
      const d = await api.hrComms("application", selected);
      setComms(d.items);
      toast.success("Communication logged.");
    } catch (err) {
      toast.error(err.message || "Could not log");
    }
  }

  function patchScreen(field, value) {
    setScreening((s) => ({ ...s, [field]: value }));
  }

  function patchOnboard(field, value) {
    setOnboarding((s) => ({ ...s, [field]: value }));
  }

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="People & HR"
        title="Recruitment"
        description="Pipeline, screening checks, onboarding, and candidate communication log."
      />

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={selected === row.id ? "is-active" : ""}
                  onClick={() => {
                    setSelected(row.id);
                    setTab("pipeline");
                  }}
                >
                  <td>{row.full_name}</td>
                  <td>{row.status}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-detail">
          {detail ? (
            <>
              <h2>{detail.application.full_name}</h2>
              <p>
                {detail.application.email} · {detail.application.phone}
              </p>

              <div className="hr-tabs" role="tablist">
                {[
                  ["pipeline", "Pipeline"],
                  ["screening", "Screening"],
                  ["onboarding", "Onboarding"],
                  ["comms", "Comms"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className={`hr-tab${tab === id ? " is-active" : ""}`}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "pipeline" ? (
                <>
                  <ul>
                    <li>
                      UK licence:{" "}
                      {detail.application.has_uk_licence ? "Yes" : "No"}
                    </li>
                    <li>
                      Own vehicle:{" "}
                      {detail.application.has_own_vehicle ? "Yes" : "No"}
                    </li>
                    <li>
                      Business insurance:{" "}
                      {detail.application.has_business_insurance ? "Yes" : "No"}
                    </li>
                    <li>
                      Care certificate:{" "}
                      {detail.application.care_certificate ? "Yes" : "No"}
                    </li>
                    <li>
                      DBS consent:{" "}
                      {detail.application.dbs_consent ? "Yes" : "No"}
                    </li>
                  </ul>
                  {detail.application.notes ? (
                    <p>
                      <strong>Candidate notes:</strong>{" "}
                      {detail.application.notes}
                    </p>
                  ) : null}

                  {detail.application.hasCv ? (
                    <p>
                      <strong>CV:</strong>{" "}
                      <a
                        href={api.applicationCvUrl(detail.application.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {detail.application.cv_original_name || "Download CV"}
                      </a>
                    </p>
                  ) : (
                    <p>
                      <strong>CV:</strong> Not provided
                    </p>
                  )}

                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Internal note
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <button type="button" onClick={updateStatus}>
                    Update &amp; notify
                  </button>

                  <h3>Timeline</h3>
                  <ol>
                    {detail.events.map((ev) => (
                      <li key={ev.id}>
                        {ev.from_status || "—"} → {ev.to_status} ·{" "}
                        {new Date(ev.created_at).toLocaleString()}
                        {ev.note ? ` — ${ev.note}` : ""}
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}

              {tab === "screening" && screening ? (
                <form className="hr-detail-form" onSubmit={saveScreening}>
                  <label>
                    Right to work
                    <select
                      value={screening.right_to_work}
                      onChange={(e) =>
                        patchScreen("right_to_work", e.target.value)
                      }
                    >
                      {["pending", "pass", "fail", "na"].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    DBS status
                    <select
                      value={screening.dbs_status}
                      onChange={(e) =>
                        patchScreen("dbs_status", e.target.value)
                      }
                    >
                      {["pending", "applied", "clear", "fail", "na"].map(
                        (v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label>
                    DBS reference
                    <input
                      value={screening.dbs_ref || ""}
                      onChange={(e) => patchScreen("dbs_ref", e.target.value)}
                    />
                  </label>
                  <label>
                    DBS date
                    <input
                      type="date"
                      value={screening.dbs_date || ""}
                      onChange={(e) => patchScreen("dbs_date", e.target.value)}
                    />
                  </label>
                  <label>
                    References
                    <select
                      value={screening.references_status}
                      onChange={(e) =>
                        patchScreen("references_status", e.target.value)
                      }
                    >
                      {["pending", "requested", "complete", "fail", "na"].map(
                        (v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label>
                    Interview score (0–100)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={screening.interview_score ?? ""}
                      onChange={(e) =>
                        patchScreen("interview_score", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Interview notes
                    <textarea
                      value={screening.interview_notes || ""}
                      onChange={(e) =>
                        patchScreen("interview_notes", e.target.value)
                      }
                    />
                  </label>
                  {[
                    ["licence_verified", "Licence verified"],
                    ["vehicle_verified", "Vehicle verified"],
                    ["insurance_verified", "Insurance verified"],
                    ["care_cert_verified", "Care certificate verified"],
                    ["cleared_to_offer", "Cleared to offer"],
                  ].map(([field, label]) => (
                    <label key={field} className="hr-check">
                      <input
                        type="checkbox"
                        checked={Boolean(screening[field])}
                        onChange={(e) =>
                          patchScreen(field, e.target.checked ? 1 : 0)
                        }
                      />
                      {label}
                    </label>
                  ))}
                  <button type="submit" className="hr-btn hr-btn--primary">
                    Save screening
                  </button>
                </form>
              ) : null}

              {tab === "onboarding" && onboarding ? (
                <form className="hr-detail-form" onSubmit={saveOnboarding}>
                  <label>
                    Stage
                    <select
                      value={onboarding.stage}
                      onChange={(e) => patchOnboard("stage", e.target.value)}
                    >
                      {ONBOARDING_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  {[
                    ["contract_signed", "Contract signed"],
                    ["induction_done", "Induction done"],
                    ["shadow_shifts_done", "Shadow shifts done"],
                  ].map(([field, label]) => (
                    <label key={field} className="hr-check">
                      <input
                        type="checkbox"
                        checked={Boolean(onboarding[field])}
                        onChange={(e) =>
                          patchOnboard(field, e.target.checked ? 1 : 0)
                        }
                      />
                      {label}
                    </label>
                  ))}
                  <label>
                    Blocker note
                    <textarea
                      value={onboarding.blocker_note || ""}
                      onChange={(e) =>
                        patchOnboard("blocker_note", e.target.value)
                      }
                    />
                  </label>
                  <p className="hr-hint">
                    Setting stage to <code>cleared</code> creates a staff file
                    and assigns mandatory training.
                  </p>
                  <button type="submit" className="hr-btn hr-btn--primary">
                    Save onboarding
                  </button>
                </form>
              ) : null}

              {tab === "comms" ? (
                <>
                  <form className="hr-detail-form" onSubmit={addComm}>
                    <label>
                      Channel
                      <select
                        value={commChannel}
                        onChange={(e) => setCommChannel(e.target.value)}
                      >
                        {["note", "email", "phone", "whatsapp", "other"].map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label>
                      Log entry
                      <textarea
                        required
                        value={commBody}
                        onChange={(e) => setCommBody(e.target.value)}
                      />
                    </label>
                    <button type="submit" className="hr-btn hr-btn--primary">
                      Add to log
                    </button>
                  </form>
                  <ul className="hr-mini-list">
                    {comms.map((c) => (
                      <li key={c.id}>
                        <strong>{c.channel}</strong> ·{" "}
                        {new Date(c.created_at).toLocaleString()}
                        <br />
                        {c.body}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          ) : (
            <p>Select an application.</p>
          )}
        </div>
      </div>
    </div>
  );
}
