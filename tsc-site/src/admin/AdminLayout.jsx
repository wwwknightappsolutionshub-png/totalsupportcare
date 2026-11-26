import {
  Link,
  NavLink,
  Outlet,
  Navigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { useCallback, useEffect, useId, useState } from "react";
import { api } from "../lib/api";
import Seo from "../seo/Seo";
import { useSite } from "../context/SiteContext";
import { AdminAlertsProvider, useAdminAlerts } from "./AdminAlertsContext";
import { useAdminSessionGuard } from "./useAdminSessionGuard";

function NavBadge({ count }) {
  if (!count) return null;
  return <span className="admin-nav__badge">{count > 99 ? "99+" : count}</span>;
}

function AdminShell({ user, onLogout }) {
  const { newApplications, newEnquiries } = useAdminAlerts();
  const { pack } = useSite();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 56.25rem)").matches
      : false
  );
  const navId = useId();
  const isOwner = user.role === "owner";
  const isHr = user.role === "hr";
  const brand = pack?.name || "Total Support Care";
  const title = isHr ? `${brand} HR` : "Site Admin";

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 56.25rem)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen || isDesktop) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [navOpen, isDesktop]);

  function navClass({ isActive }) {
    return isActive ? "is-active" : undefined;
  }

  function navRowClass({ isActive }) {
    return `admin-nav__link-row${isActive ? " is-active" : ""}`;
  }

  return (
    <div className={`admin-shell${navOpen ? " is-nav-open" : ""}`}>
      <Seo
        title={isHr ? `HR | ${brand}` : `Admin | ${brand}`}
        description="Private administration area."
        path="/admin"
        noindex
      />

      <header className="admin-topbar">
        <button
          type="button"
          className="admin-topbar__toggle"
          aria-expanded={navOpen}
          aria-controls={navId}
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="admin-topbar__toggle-bars" aria-hidden="true" />
          <span className="admin-sr-only">
            {navOpen ? "Close menu" : "Open menu"}
          </span>
        </button>
        <div className="admin-topbar__brand">
          <img
            src="/packs/totalsupport-icon.svg"
            alt=""
            width={28}
            height={28}
          />
          <div>
            <strong>{title}</strong>
            <span>{brand}</span>
          </div>
        </div>
      </header>

      <button
        type="button"
        className="admin-nav-backdrop"
        aria-label="Close menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      <aside
        id={navId}
        className="admin-nav"
        aria-hidden={isDesktop ? undefined : !navOpen}
        inert={isDesktop || navOpen ? undefined : true}
      >
        <div className="admin-nav__head">
          <p className="admin-nav__brand">{title}</p>
          <button
            type="button"
            className="admin-nav__close"
            onClick={() => setNavOpen(false)}
          >
            Close
          </button>
        </div>
        <p className="admin-nav__section">{brand}</p>

        {isOwner ? (
          <>
            <p className="admin-nav__section">Site</p>
            <NavLink to="/admin" end className={navClass}>
              Overview
            </NavLink>
            <NavLink to="/admin/pages" className={navClass}>
              Site CMS
            </NavLink>
            <NavLink to="/admin/settings" className={navClass}>
              Settings
            </NavLink>
            <NavLink to="/admin/media" className={navClass}>
              Media
            </NavLink>
            <NavLink to="/admin/whatsapp" className={navClass}>
              WhatsApp CRM
            </NavLink>
          </>
        ) : null}

        <p className="admin-nav__section">People &amp; HR</p>
        {isHr ? (
          <NavLink to="/admin" end className={navClass}>
            HR Home
          </NavLink>
        ) : (
          <NavLink to="/admin/hr" className={navClass}>
            HR Home
          </NavLink>
        )}
        <NavLink to="/admin/applications" className={navRowClass}>
          <span>Recruitment</span>
          <NavBadge count={newApplications} />
        </NavLink>
        <NavLink to="/admin/hr/staff" className={navClass}>
          Staff files
        </NavLink>
        <NavLink to="/admin/hr/training" className={navClass}>
          Training
        </NavLink>
        <NavLink to="/admin/hr/absences" className={navClass}>
          Absence
        </NavLink>
        <NavLink to="/admin/hr/tasks" className={navClass}>
          Tasks
        </NavLink>
        <NavLink to="/admin/hr/reports" className={navClass}>
          Reports
        </NavLink>
        <NavLink to="/admin/messages" className={navRowClass}>
          <span>Enquiries</span>
          <NavBadge count={newEnquiries} />
        </NavLink>

        <button type="button" className="admin-nav__logout" onClick={onLogout}>
          Sign out
        </button>
        <p className="admin-nav__meta">
          {user.email}
          <span className="admin-nav__role">{user.role}</span>
        </p>
        <Link to="/" className="admin-nav__site">
          View public site
        </Link>
      </aside>

      <main className="admin-main">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

export default function AdminLayout() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const endSession = useCallback(async (reason) => {
    try {
      await api.logout();
    } catch {
      /* already cleared */
    }
    if (reason) {
      try {
        sessionStorage.setItem("admin_session_end", reason);
      } catch {
        /* private mode */
      }
    }
    window.location.href = "/admin/login";
  }, []);

  useAdminSessionGuard({
    enabled: Boolean(user),
    onExpire: endSession,
  });

  if (user === undefined) {
    return <div className="admin-shell admin-shell--loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  async function logout() {
    await endSession(null);
  }

  return (
    <AdminAlertsProvider>
      <AdminShell user={user} onLogout={logout} />
    </AdminAlertsProvider>
  );
}

export { OwnerOnly } from "./OwnerOnly.jsx";
