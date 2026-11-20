import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { useSite } from "../context/SiteContext";
import AdminPageHeader from "./AdminPageHeader";

function blankNav() {
  return { label: "", to: "/" };
}

function blankSocial() {
  return { label: "Instagram", href: "https://", icon: "instagram" };
}

const SECTIONS = [
  { id: "brand", label: "Brand" },
  { id: "contact", label: "Contact" },
  { id: "navigation", label: "Navigation" },
  { id: "social", label: "Social" },
  { id: "security", label: "Security" },
];

export default function AdminSettings() {
  const toast = useToast();
  const { refreshSettings } = useSite();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("brand");
  const [form, setForm] = useState({
    brandName: "",
    tagline: "",
    logo: "",
    logoIcon: "",
    logoIconLime: "",
    logoWordmark: "",
    phoneDisplay: "",
    phoneHref: "",
    email: "",
    hrEmail: "",
    addressLine: "",
    addressShort: "",
    nav: [],
    footerNav: [],
    social: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.adminSettings();
        if (cancelled) return;
        const s = data.settings || {};
        setForm({
          brandName: s.brandName || "",
          tagline: s.tagline || "",
          logo: s.logo || "",
          logoIcon: s.logoIcon || "",
          logoIconLime: s.logoIconLime || "",
          logoWordmark: s.logoWordmark || "",
          phoneDisplay: s.phoneDisplay || "",
          phoneHref: s.phoneHref || "",
          email: s.email || "",
          hrEmail: s.hrEmail || "",
          addressLine: s.addressLine || "",
          addressShort: s.addressShort || "",
          nav: Array.isArray(s.nav) ? s.nav : [],
          footerNav: Array.isArray(s.footerNav) ? s.footerNav : [],
          social: Array.isArray(s.social) ? s.social : [],
        });
      } catch (err) {
        toast.error(err.message || "Could not load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateList(key, index, patch) {
    setForm((prev) => {
      const list = [...(prev[key] || [])];
      list[index] = { ...list[index], ...patch };
      return { ...prev, [key]: list };
    });
  }

  function removeListItem(key, index) {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, j) => j !== index),
    }));
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patchSettings({
        brandName: form.brandName,
        tagline: form.tagline,
        logo: form.logo,
        logoIcon: form.logoIcon,
        logoIconLime: form.logoIconLime,
        logoWordmark: form.logoWordmark,
        phoneDisplay: form.phoneDisplay,
        phoneHref: form.phoneHref,
        email: form.email,
        hrEmail: form.hrEmail,
        addressLine: form.addressLine,
        addressShort: form.addressShort,
        nav: form.nav.filter((n) => n.label && n.to),
        footerNav: form.footerNav.filter((n) => n.label && n.to),
        social: form.social.filter((n) => n.label && n.href),
      });
      if (typeof refreshSettings === "function") await refreshSettings();
      toast.success("Settings saved — live site updated.");
    } catch (err) {
      toast.error(err.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  function goToSection(id) {
    setActiveSection(id);
    const el = document.getElementById(`settings-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="admin-panel admin-settings">
        <p className="admin-settings__loading">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="admin-panel admin-settings">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Site settings"
        description="Manage brand, contact details, navigation, and account security. Site changes publish immediately."
        actions={
          <button
            type="submit"
            form="admin-settings-form"
            className="admin-btn"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        }
      />

      <div className="admin-settings__shell">
        <aside className="admin-settings__rail" aria-label="Settings sections">
          <p className="admin-settings__rail-label">Sections</p>
          <nav className="admin-settings__rail-nav">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeSection === section.id
                    ? "admin-settings__rail-link is-active"
                    : "admin-settings__rail-link"
                }
                onClick={() => goToSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-settings__workspace">
          <form
            id="admin-settings-form"
            className="admin-settings__form"
            onSubmit={onSave}
          >
            <section
              id="settings-brand"
              className="admin-settings__card"
              onFocus={() => setActiveSection("brand")}
            >
              <header className="admin-settings__card-head">
                <div>
                  <h2>Brand</h2>
                  <p>Public name, tagline, and logo assets used across the site.</p>
                </div>
              </header>
              <div className="admin-settings__fields admin-settings__fields--2">
                <label className="admin-settings__field">
                  <span>Brand name</span>
                  <input
                    value={form.brandName}
                    onChange={(e) => setField("brandName", e.target.value)}
                    required
                  />
                </label>
                <label className="admin-settings__field">
                  <span>Tagline</span>
                  <input
                    value={form.tagline}
                    onChange={(e) => setField("tagline", e.target.value)}
                    placeholder="Care as individual as you."
                  />
                </label>
                <label className="admin-settings__field admin-settings__field--full">
                  <span>Logo / icon URL</span>
                  <input
                    value={form.logoIcon || form.logo}
                    onChange={(e) => {
                      setField("logo", e.target.value);
                      setField("logoIcon", e.target.value);
                    }}
                    placeholder="/packs/totalsupport-icon.svg"
                  />
                </label>
                <label className="admin-settings__field">
                  <span>Footer lime icon URL</span>
                  <input
                    value={form.logoIconLime}
                    onChange={(e) => setField("logoIconLime", e.target.value)}
                  />
                </label>
                <label className="admin-settings__field">
                  <span>Wordmark URL</span>
                  <input
                    value={form.logoWordmark}
                    onChange={(e) => setField("logoWordmark", e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section
              id="settings-contact"
              className="admin-settings__card"
              onFocus={() => setActiveSection("contact")}
            >
              <header className="admin-settings__card-head">
                <div>
                  <h2>Contact</h2>
                  <p>Phone, email, and address shown on the public site.</p>
                </div>
              </header>
              <div className="admin-settings__fields admin-settings__fields--2">
                <label className="admin-settings__field">
                  <span>Phone display</span>
                  <input
                    value={form.phoneDisplay}
                    onChange={(e) => setField("phoneDisplay", e.target.value)}
                  />
                </label>
                <label className="admin-settings__field">
                  <span>Phone href</span>
                  <input
                    value={form.phoneHref}
                    onChange={(e) => setField("phoneHref", e.target.value)}
                    placeholder="tel:+447522347972"
                  />
                </label>
                <label className="admin-settings__field">
                  <span>Public email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </label>
                <label className="admin-settings__field">
                  <span>HR email</span>
                  <input
                    type="email"
                    value={form.hrEmail}
                    onChange={(e) => setField("hrEmail", e.target.value)}
                  />
                </label>
                <label className="admin-settings__field admin-settings__field--full">
                  <span>Address line</span>
                  <input
                    value={form.addressLine}
                    onChange={(e) => setField("addressLine", e.target.value)}
                  />
                </label>
                <label className="admin-settings__field admin-settings__field--full">
                  <span>Short address</span>
                  <input
                    value={form.addressShort}
                    onChange={(e) => setField("addressShort", e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section
              id="settings-navigation"
              className="admin-settings__card"
              onFocus={() => setActiveSection("navigation")}
            >
              <header className="admin-settings__card-head">
                <div>
                  <h2>Navigation</h2>
                  <p>Header and footer menus for the live site.</p>
                </div>
              </header>

              <div className="admin-settings__subblock">
                <div className="admin-settings__subhead">
                  <h3>Header navigation</h3>
                  <button
                    type="button"
                    className="admin-settings__ghost-btn"
                    onClick={() => setField("nav", [...form.nav, blankNav()])}
                  >
                    Add item
                  </button>
                </div>
                <LinkEditorList
                  items={form.nav}
                  columns={["label", "to"]}
                  placeholders={{ label: "Label", to: "/path" }}
                  onChange={(i, patch) => updateList("nav", i, patch)}
                  onRemove={(i) => removeListItem("nav", i)}
                  empty="No header links yet."
                />
              </div>

              <div className="admin-settings__subblock">
                <div className="admin-settings__subhead">
                  <h3>Footer navigation</h3>
                  <button
                    type="button"
                    className="admin-settings__ghost-btn"
                    onClick={() =>
                      setField("footerNav", [...form.footerNav, blankNav()])
                    }
                  >
                    Add item
                  </button>
                </div>
                <LinkEditorList
                  items={form.footerNav}
                  columns={["label", "to"]}
                  placeholders={{ label: "Label", to: "/path" }}
                  onChange={(i, patch) => updateList("footerNav", i, patch)}
                  onRemove={(i) => removeListItem("footerNav", i)}
                  empty="No footer links yet."
                />
              </div>
            </section>

            <section
              id="settings-social"
              className="admin-settings__card"
              onFocus={() => setActiveSection("social")}
            >
              <header className="admin-settings__card-head">
                <div>
                  <h2>Social links</h2>
                  <p>Optional profiles shown in the site footer.</p>
                </div>
                <button
                  type="button"
                  className="admin-settings__ghost-btn"
                  onClick={() =>
                    setField("social", [...form.social, blankSocial()])
                  }
                >
                  Add link
                </button>
              </header>
              <LinkEditorList
                items={form.social}
                columns={["label", "href", "icon"]}
                placeholders={{
                  label: "Label",
                  href: "https://…",
                  icon: "icon key",
                }}
                onChange={(i, patch) => updateList("social", i, patch)}
                onRemove={(i) => removeListItem("social", i)}
                empty="No social links configured."
              />
            </section>

            <div className="admin-settings__form-footer">
              <p>Site settings save immediately to the live public site.</p>
              <button type="submit" className="admin-btn" disabled={saving}>
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>

          <section
            id="settings-security"
            className="admin-settings__card admin-settings__card--security"
            onFocus={() => setActiveSection("security")}
          >
            <PasswordChangeCard />
          </section>
        </div>
      </div>
    </div>
  );
}

function LinkEditorList({
  items,
  columns,
  placeholders,
  onChange,
  onRemove,
  empty,
}) {
  if (!items?.length) {
    return <p className="admin-settings__empty">{empty}</p>;
  }

  return (
    <div className="admin-settings__table">
      <div
        className={`admin-settings__table-head admin-settings__table-head--${columns.length}`}
      >
        {columns.map((col) => (
          <span key={col}>{col === "to" ? "Path" : col}</span>
        ))}
        <span className="admin-settings__table-actions">Actions</span>
      </div>
      <ul className="admin-settings__table-body">
        {items.map((item, i) => (
          <li
            key={i}
            className={`admin-settings__table-row admin-settings__table-row--${columns.length}`}
          >
            {columns.map((col) => (
              <input
                key={col}
                value={item[col] || ""}
                placeholder={placeholders[col]}
                onChange={(e) => onChange(i, { [col]: e.target.value })}
              />
            ))}
            <button
              type="button"
              className="admin-settings__remove"
              onClick={() => onRemove(i)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function passwordChecks(password) {
  return {
    length: password.length >= 10,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  show,
  onToggleShow,
  error,
  minLength,
}) {
  return (
    <label className="admin-settings__field" htmlFor={id}>
      <span>{label}</span>
      <div className="admin-password__input-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required
          minLength={minLength}
          maxLength={200}
          aria-invalid={error ? "true" : undefined}
        />
        <button
          type="button"
          className="admin-password__reveal"
          onClick={onToggleShow}
          aria-pressed={show}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <span className="admin-password__error">{error}</span> : null}
    </label>
  );
}

function PasswordChangeCard() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const checks = passwordChecks(newPassword);

  function validate() {
    const next = {};
    if (!currentPassword || currentPassword.length < 8) {
      next.currentPassword = "Enter your current password.";
    }
    if (!checks.length || !checks.letter || !checks.number) {
      next.newPassword =
        "Use at least 10 characters with at least one letter and one number.";
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      next.newPassword = "New password must be different from the current one.";
    }
    if (confirmPassword !== newPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Fix the password fields and try again.");
      return;
    }
    setBusy(true);
    setFieldErrors({});
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success("Password saved. Use it next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      const code = err?.data?.error || err?.message;
      if (code === "account_locked" || err?.status === 429) {
        toast.error("Too many attempts. Try again later.");
      } else if (code === "password_unchanged") {
        setFieldErrors({
          newPassword: "New password must be different from the current one.",
        });
        toast.error("Choose a different new password.");
      } else if (code === "password_complexity") {
        setFieldErrors({
          newPassword:
            "Use at least 10 characters with at least one letter and one number.",
        });
        toast.error("New password does not meet the requirements.");
      } else if (code === "invalid_credentials" || err?.status === 401) {
        setFieldErrors({ currentPassword: "Current password is incorrect." });
        toast.error("Current password is incorrect.");
      } else {
        toast.error("Could not save the new password.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-password" onSubmit={onSubmit} noValidate>
      <header className="admin-settings__card-head">
        <div>
          <h2 id="admin-password-title">Security</h2>
          <p>
            Reset your admin password. You’ll stay signed in after saving; use
            the new password next time you sign in.
          </p>
        </div>
      </header>

      <div className="admin-settings__fields admin-settings__fields--2">
        <PasswordField
          id="admin-current-password"
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          show={showCurrent}
          onToggleShow={() => setShowCurrent((v) => !v)}
          error={fieldErrors.currentPassword}
          minLength={8}
        />
        <div className="admin-settings__field admin-settings__field--spacer" />
        <PasswordField
          id="admin-new-password"
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          show={showNew}
          onToggleShow={() => setShowNew((v) => !v)}
          error={fieldErrors.newPassword}
          minLength={10}
        />
        <PasswordField
          id="admin-confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          show={showConfirm}
          onToggleShow={() => setShowConfirm((v) => !v)}
          error={fieldErrors.confirmPassword}
          minLength={10}
        />
      </div>

      <ul className="admin-password__rules" aria-label="Password requirements">
        <li className={checks.length ? "is-met" : undefined}>
          At least 10 characters
        </li>
        <li className={checks.letter ? "is-met" : undefined}>
          Contains a letter
        </li>
        <li className={checks.number ? "is-met" : undefined}>
          Contains a number
        </li>
        <li
          className={
            confirmPassword && confirmPassword === newPassword
              ? "is-met"
              : undefined
          }
        >
          Confirmation matches
        </li>
      </ul>

      <p className="admin-password__note">
        Failed attempts count toward account lockout. Forgot your current
        password? Use <strong>Forgot password?</strong> on the sign-in page.
      </p>

      <div className="admin-password__actions">
        <button type="submit" className="admin-btn" disabled={busy}>
          {busy ? "Saving password…" : "Save new password"}
        </button>
      </div>
    </form>
  );
}
