import { useEffect, useState } from "react";
import { api } from "../lib/api";
import AdminPageHeader from "./AdminPageHeader";

export default function AdminWhatsApp() {
  const [items, setItems] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    api.whatsappConversations().then((d) => {
      setItems(d.items);
      setEnabled(d.enabled);
      if (d.items[0]) setSelected(d.items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.whatsappMessages(selected).then((d) => setMessages(d.items));
  }, [selected]);

  return (
    <div className="admin-panel">
      <AdminPageHeader
        eyebrow="Messaging"
        title="WhatsApp CRM"
        description="Conversations captured by the Meta webhook. Live send/receive requires Cloud API credentials in the API environment."
        meta={
          enabled ? "Cloud API enabled" : "Disabled · development safe mode"
        }
      />

      <div className="admin-split">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>WhatsApp ID</th>
                <th>Name</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={selected === row.id ? "is-active" : ""}
                  onClick={() => setSelected(row.id)}
                >
                  <td>{row.wa_id}</td>
                  <td>{row.display_name || "—"}</td>
                  <td>{new Date(row.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 ? <p>No conversations yet.</p> : null}
        </div>
        <div className="admin-detail">
          <h2>Thread</h2>
          <ul className="admin-chat">
            {messages.map((m) => (
              <li key={m.id} className={m.direction}>
                <span>{m.direction}</span>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
