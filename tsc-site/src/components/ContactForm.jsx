import { useState } from "react";
import { api } from "../lib/api";
import { useSite } from "../context/SiteContext";
import { usePublicFormSecurity } from "../hooks/usePublicFormSecurity";
import { contactFormSchema } from "../lib/validation/schemas";
import { firstErrorMessage } from "../lib/validation/sanitize";
import { useToast } from "./Toast";

export default function ContactForm({ variant = "default" }) {
  const { settings } = useSite();
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const { formConfig, turnstileRef, getCaptchaToken, resetCaptcha } =
    usePublicFormSecurity({ theme: "light" });

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);

    let captchaToken = "";
    if (formConfig.captchaRequired) {
      captchaToken = getCaptchaToken();
      if (!captchaToken) {
        const msg = "Please complete the security check.";
        setError(msg);
        toast.error(msg);
        setBusy(false);
        return;
      }
    }

    const parsed = contactFormSchema.safeParse({
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      interest: String(form.get("interest") || ""),
      message: String(form.get("message") || ""),
      website: String(form.get("website") || ""),
      formStartedAt: startedAt,
      captchaToken,
    });

    if (!parsed.success) {
      const msg = firstErrorMessage(parsed.error);
      setError(msg);
      toast.error(msg);
      setBusy(false);
      return;
    }

    // Honeypot filled — pretend success
    if (parsed.data.website) {
      setSent(true);
      setBusy(false);
      return;
    }

    try {
      const { website: _hp, ...payload } = parsed.data;
      await api.submitContact({ ...payload, website: "" });
      setSent(true);
      toast.success("Enquiry sent — we'll be in touch shortly.");
    } catch (err) {
      const code = err?.data?.error;
      const msg =
        code === "too_many_attempts"
          ? "Too many attempts. Please wait and try again later."
          : code === "submit_timing_invalid"
            ? "Please take a moment to review the form, then try again."
            : code === "captcha_required" || code === "captcha_failed"
              ? "Security check failed. Please try again."
              : "Could not send enquiry. Please call us or try again.";
      if (code === "captcha_required" || code === "captcha_failed") {
        resetCaptcha();
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="form-success" role="status">
        Thank you — we&apos;ll be in touch shortly. For urgent needs, please call
        us now.
      </div>
    );
  }

  return (
    <form
      className={`contact-form ${variant === "dock" ? "contact-form--dock" : ""}`}
      onSubmit={onSubmit}
      noValidate
    >
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          maxLength={200}
        />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
        />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          maxLength={40}
          inputMode="tel"
        />
      </div>
      <div className="field">
        <label htmlFor="interest">I&apos;m enquiring about</label>
        <select id="interest" name="interest" defaultValue="domiciliary" required>
          <option value="domiciliary">Domiciliary care</option>
          <option value="dementia">Dementia care</option>
          <option value="eol">End-of-life care</option>
          <option value="respite">Respite / family support</option>
          <option value="careers">Joining the team</option>
          <option value="other">Something else</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">How can we help?</label>
        <textarea id="message" name="message" required maxLength={5000} rows={5} />
      </div>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {formConfig.turnstileSiteKey ? (
        <div className="turnstile-wrap" ref={turnstileRef} />
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-solid" disabled={busy}>
        {busy ? "Sending…" : "Send enquiry"}
      </button>
      <p className="form-note">
        One of our friendly staff will contact you directly. Prefer to talk?{" "}
        <a href={settings.phoneHref}>{settings.phoneDisplay}</a>
      </p>
    </form>
  );
}
