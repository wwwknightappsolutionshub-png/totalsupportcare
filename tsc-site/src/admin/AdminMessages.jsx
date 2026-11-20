import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AdminPageHeader from "./AdminPageHeader";

export default function AdminMessages() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.contactMessages().then((d) => setItems(d.items));
  }, []);

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="Inbox"
        title="Enquiries"
        description="Family and referral messages submitted from the public contact form."
        meta={`${items.length} ${items.length === 1 ? "message" : "messages"}`}
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Interest</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.interest || "—"}</td>
                <td>{row.status}</td>
                <td>{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
