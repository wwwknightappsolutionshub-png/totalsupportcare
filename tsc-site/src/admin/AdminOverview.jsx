import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import AdminPageHeader from "./AdminPageHeader";

const MODULES = [
  {
    to: "/admin/pages",
    kicker: "Site CMS",
    title: "Edit pages",
    body: "Draft and publish schema sections for Home, About, Services, and more.",
    accent: "teal",
    countKey: "pages",
    countLabel: "pages",
  },
  {
    to: "/admin/media",
    kicker: "Assets",
    title: "Media gallery",
    body: "Upload images from your device, reuse them in the CMS, or delete permanently.",
    accent: "mist",
    countKey: "media",
    countLabel: "images",
  },
  {
    to: "/admin/applications",
    kicker: "Recruitment",
    title: "Review applications",
    body: "Move candidates through screening, interview, offer, and hire.",
    accent: "rose",
    countKey: "applications",
    countLabel: "in pipeline",
  },
  {
    to: "/admin/messages",
    kicker: "Enquiries",
    title: "Contact messages",
    body: "Family and referral enquiries submitted from the public site.",
    accent: "mist",
    countKey: "messages",
    countLabel: "messages",
  },
  {
    to: "/admin/whatsapp",
    kicker: "WhatsApp CRM",
    title: "Inbox",
    body: "Conversations captured by the Meta webhook (when enabled).",
    accent: "ink",
    countKey: "conversations",
    countLabel: "threads",
  },
];

export default function AdminOverview() {
  const [stats, setStats] = useState({
    pages: null,
    media: null,
    applications: null,
    messages: null,
    conversations: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pages, media, applications, messages, conversations] =
        await Promise.allSettled([
          api.adminPages(),
          api.mediaList(),
          api.applications(),
          api.contactMessages(),
          api.whatsappConversations(),
        ]);
      if (cancelled) return;
      setStats({
        pages:
          pages.status === "fulfilled" ? pages.value.items?.length ?? 0 : "—",
        media:
          media.status === "fulfilled" ? media.value.items?.length ?? 0 : "—",
        applications:
          applications.status === "fulfilled"
            ? applications.value.items?.length ?? 0
            : "—",
        messages:
          messages.status === "fulfilled"
            ? messages.value.items?.length ?? 0
            : "—",
        conversations:
          conversations.status === "fulfilled"
            ? conversations.value.items?.length ?? 0
            : "—",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="admin-panel admin-overview">
      <AdminPageHeader
        eyebrow="Operations"
        title="Overview"
        description="Manage published website content, recruitment applications, contact enquiries, and WhatsApp conversations."
      />

      <ul className="admin-overview__grid">
        {MODULES.map((mod) => (
          <li key={mod.to}>
            <Link
              to={mod.to}
              className={`admin-overview__card admin-overview__card--${mod.accent}`}
            >
              <div className="admin-overview__card-top">
                <span className="admin-overview__kicker">{mod.kicker}</span>
                <span className="admin-overview__stat">
                  <strong>{stats[mod.countKey] ?? "…"}</strong>
                  <span>{mod.countLabel}</span>
                </span>
              </div>
              <h2>{mod.title}</h2>
              <p>{mod.body}</p>
              <span className="admin-overview__go">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
