import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { useSite } from "../context/SiteContext";
import { loginFormSchema } from "../lib/validation/schemas";
import { firstErrorMessage } from "../lib/validation/sanitize";
import Seo from "../seo/Seo";

function authErrorMessage(err) {
  const code = err?.data?.error || err?.message;
  if (code === "account_locked" || err?.status === 429) {
    const sec = err?.data?.retryAfterSec;
    return sec
      ? `Too many attempts. Try again in ${sec}s.`
      : "Too many attempts. Try again later.";
  }
  if (code === "invalid_or_expired_token") {
    return "That reset link is invalid or has expired.";
  }
  return "Invalid credentials or server unavailable.";
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Capture reset token once, then strip it from the URL (history / Referer).
  const tokenRef = useRef(params.get("token") || "");
  const resetToken = tokenRef.current;
  const toast = useToast();
  const { settings } = useSite();
  const brandName = settings?.brandName || "Total Support Care";
  const tagline = settings?.tagline || "Care as individual as you.";
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.get("token")) return;
    navigate("/admin/login", { replace: true });
  }, [params, navigate]);

  useEffect(() => {
    let reason = null;
    try {
      reason = sessionStorage.getItem("admin_session_end");
      if (reason) sessionStorage.removeItem("admin_session_end");
    } catch {
      /* ignore */
    }
    if (reason === "idle") {
      toast.error("Signed out after 5 minutes of inactivity.");
    } else if (reason === "replaced") {
      toast.error("Signed out — this account was opened on another device.");
    }
  }, [toast]);

  async function onLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const msg = firstErrorMessage(parsed.error);
      setError(msg);
      toast.error(msg);
      setBusy(false);
      return;
    }

    try {
      await api.login(parsed.data);
      toast.success("Signed in.");
      navigate("/admin", { replace: true });
    } catch (err) {
      const msg = authErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onRequestReset(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.requestPasswordReset({ email });
      if (data?.devResetToken) {
        tokenRef.current = data.devResetToken;
        setMode("reset");
        toast.success("Dev reset ready — choose a new password.");
      } else {
        toast.success("If that account exists, reset instructions were issued.");
        setMode("login");
      }
    } catch (err) {
      const msg = authErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onCompleteReset(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.resetPassword({ token: tokenRef.current, newPassword });
      toast.success("Password updated. Sign in with your new password.");
      setMode("login");
      setPassword("");
      setNewPassword("");
      navigate("/admin/login", { replace: true });
    } catch (err) {
      const msg = authErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <Seo
        title="Sign in | Admin"
        description="Private administrator sign-in."
        path="/admin/login"
        noindex
      />

      <aside className="admin-login__brand" aria-label={`${brandName} branding`}>
        <div className="admin-login__brand-glow" aria-hidden="true" />
        <div className="admin-login__brand-inner">
          <img
            className="admin-login__logo"
            src="/packs/totalsupport-logo-light.svg"
            alt={brandName}
            width={420}
            height={120}
          />
          <p className="admin-login__portal">Staff portal</p>
          <p className="admin-login__brand-note">
            CMS, HR and operations for {brandName}.
          </p>
        </div>
      </aside>

      <main className="admin-login__panel">
        {mode === "login" ? (
          <form className="admin-login__card" onSubmit={onLogin} noValidate>
            <div className="admin-login__card-brand" aria-hidden="true">
              <img
                src="/packs/totalsupport-icon.svg"
                alt=""
                width={40}
                height={40}
              />
              <span>{brandName}</span>
            </div>
            <h1>Admin sign in</h1>
            <p>CMS, HR and operations access.</p>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={200}
              />
            </label>
            {error ? <p className="admin-error">{error}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="admin-login__hint">
              <button
                type="button"
                className="admin-linkish"
                onClick={() => {
                  setError("");
                  setMode("forgot");
                }}
              >
                Forgot password?
              </button>
            </p>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form
            className="admin-login__card"
            onSubmit={onRequestReset}
            noValidate
          >
            <h1>Reset password</h1>
            <p>
              Enter your admin email. We’ll issue a reset if the account exists.
            </p>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
              />
            </label>
            {error ? <p className="admin-error">{error}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Request reset"}
            </button>
            <p className="admin-login__hint">
              <button
                type="button"
                className="admin-linkish"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
              >
                Back to sign in
              </button>
            </p>
          </form>
        ) : null}

        {mode === "reset" ? (
          <form
            className="admin-login__card"
            onSubmit={onCompleteReset}
            noValidate
          >
            <h1>Choose a new password</h1>
            <p>Use at least 10 characters with letters and a number.</p>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={10}
                maxLength={200}
              />
            </label>
            {error ? <p className="admin-error">{error}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        ) : null}

        <p className="admin-login__foot">{tagline}</p>
      </main>
    </div>
  );
}
