import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  HIRING_INTERVIEW,
  OPPORTUNITIES,
  OPPORTUNITIES_HERO,
} from "../data/site";
import { pageHeroFallback } from "../data/packFallbacks";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";
import { useCmsPage, useSite } from "../context/SiteContext";
import { applyFormSchema } from "../lib/validation/schemas";
import { firstErrorMessage } from "../lib/validation/sanitize";
import Seo from "../seo/Seo";
import { pageSeoForPack } from "../seo/pageMeta";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
} from "../seo/jsonLd";

const CV_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const CV_MAX_BYTES = 5 * 1024 * 1024;

function ApplyForm() {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [cvFile, setCvFile] = useState(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState("");
  const [applyConfig, setApplyConfig] = useState({
    captchaRequired: false,
    turnstileSiteKey: null,
  });
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    api.getApplyConfig().then(setApplyConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!applyConfig.turnstileSiteKey) return undefined;
    const siteKey = applyConfig.turnstileSiteKey;

    function renderWidget() {
      if (!window.turnstile || !turnstileRef.current) return;
      if (widgetIdRef.current != null) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        theme: "dark",
      });
    }

    if (window.turnstile) {
      renderWidget();
      return undefined;
    }

    const existing = document.querySelector("script[data-kerry-turnstile]");
    if (existing) {
      existing.addEventListener("load", renderWidget);
      return () => existing.removeEventListener("load", renderWidget);
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.kerryTurnstile = "1";
    script.addEventListener("load", renderWidget);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", renderWidget);
  }, [applyConfig.turnstileSiteKey]);

  useEffect(() => {
    return () => {
      if (cvPreviewUrl) URL.revokeObjectURL(cvPreviewUrl);
    };
  }, [cvPreviewUrl]);

  function onCvChange(e) {
    const file = e.target.files?.[0] || null;
    if (cvPreviewUrl) URL.revokeObjectURL(cvPreviewUrl);
    setCvPreviewUrl("");
    setCvFile(null);
    setError("");
    if (!file) return;
    if (file.size > CV_MAX_BYTES) {
      setError("CV must be 5MB or smaller.");
      e.target.value = "";
      return;
    }
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".pdf", ".doc", ".docx"].includes(ext)) {
      setError("CV must be a PDF, DOC, or DOCX file.");
      e.target.value = "";
      return;
    }
    setCvFile(file);
    setCvPreviewUrl(URL.createObjectURL(file));
  }

  function clearCv() {
    if (cvPreviewUrl) URL.revokeObjectURL(cvPreviewUrl);
    setCvPreviewUrl("");
    setCvFile(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    let captchaToken = "";
    if (applyConfig.captchaRequired && window.turnstile && widgetIdRef.current != null) {
      captchaToken = window.turnstile.getResponse(widgetIdRef.current) || "";
      if (!captchaToken) {
        setBusy(false);
        setError("Please complete the security check.");
        return;
      }
    }

    const parsed = applyFormSchema.safeParse({
      fullName: String(form.get("fullName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      hasUkLicence: form.get("hasUkLicence") === "on",
      hasOwnVehicle: form.get("hasOwnVehicle") === "on",
      hasBusinessInsurance: form.get("hasBusinessInsurance") === "on",
      careCertificate: form.get("careCertificate") === "on",
      dbsConsent: form.get("dbsConsent") === "on" ? true : false,
      notes: String(form.get("notes") || ""),
      formStartedAt: startedAt,
      website: String(form.get("website") || ""),
      captchaToken,
    });

    if (!parsed.success) {
      const msg = firstErrorMessage(parsed.error);
      setError(msg);
      toast.error(msg);
      setBusy(false);
      return;
    }

    form.set("formStartedAt", String(parsed.data.formStartedAt));
    form.set("fullName", parsed.data.fullName);
    form.set("email", parsed.data.email);
    form.set("phone", parsed.data.phone);
    form.set("notes", parsed.data.notes || "");
    form.set("hasUkLicence", parsed.data.hasUkLicence ? "true" : "false");
    form.set("hasOwnVehicle", parsed.data.hasOwnVehicle ? "true" : "false");
    form.set(
      "hasBusinessInsurance",
      parsed.data.hasBusinessInsurance ? "true" : "false"
    );
    form.set("careCertificate", parsed.data.careCertificate ? "true" : "false");
    form.set("dbsConsent", parsed.data.dbsConsent ? "true" : "false");
    if (captchaToken) form.set("captchaToken", captchaToken);
    if (cvFile) form.set("cv", cvFile);

    try {
      await api.submitApplication(form);
      setSent(true);
      clearCv();
      toast.success("Application received. Our HR team will be in touch.");
    } catch (err) {
      const code = err?.data?.error;
      let msg = "Could not submit application. Please try again or email HR.";
      if (code === "validation_failed") {
        msg = "Please complete all required fields and DBS consent.";
      } else if (code === "invalid_cv_type" || code === "cv_too_large") {
        msg = "CV must be PDF/DOC/DOCX and 5MB or smaller.";
      } else if (code === "submit_timing_invalid") {
        msg = "Please take a moment to review the form, then try again.";
      } else if (code === "captcha_required" || code === "captcha_failed") {
        msg = "Security check failed. Please try again.";
        if (window.turnstile && widgetIdRef.current != null) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } else if (code === "too_many_attempts") {
        msg = "Too many attempts. Please wait and try again later.";
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
        Application received. Our HR team will review it and update you on
        progress.
      </div>
    );
  }

  return (
    <form className="apply-form" onSubmit={onSubmit} noValidate>
      <h3>Apply online</h3>
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          maxLength={200}
        />
      </div>
      <div className="field">
        <label htmlFor="applyEmail">Email</label>
        <input
          id="applyEmail"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
        />
      </div>
      <div className="field">
        <label htmlFor="applyPhone">Phone</label>
        <input
          id="applyPhone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          maxLength={40}
          inputMode="tel"
        />
      </div>
      <label className="check">
        <input type="checkbox" name="hasUkLicence" /> Full UK driving licence
      </label>
      <label className="check">
        <input type="checkbox" name="hasOwnVehicle" /> Own vehicle
      </label>
      <label className="check">
        <input type="checkbox" name="hasBusinessInsurance" /> Business insurance
      </label>
      <label className="check">
        <input type="checkbox" name="careCertificate" /> Level 2 care certificate
        (or willing to attain)
      </label>
      <label className="check">
        <input type="checkbox" name="dbsConsent" required /> I consent to an
        advanced DBS check
      </label>

      <div className="cv-field">
        <span>CV (optional)</span>
        <div className="cv-field__input">
          <label className="cv-field__btn">
            <input
              type="file"
              accept={CV_ACCEPT}
              onChange={onCvChange}
            />
            {cvFile ? "Change CV" : "Upload CV"}
          </label>
          {cvFile ? (
            <button type="button" className="cv-field__btn" onClick={clearCv}>
              Remove
            </button>
          ) : null}
        </div>
        <p className="cv-field__meta">
          PDF, DOC or DOCX · max 5MB
          {cvFile ? ` · ${cvFile.name}` : ""}
        </p>
        {cvFile && cvPreviewUrl ? (
          cvFile.type === "application/pdf" ||
          cvFile.name.toLowerCase().endsWith(".pdf") ? (
            <div className="cv-preview">
              <iframe title="CV preview" src={cvPreviewUrl} />
            </div>
          ) : (
            <div className="cv-preview">
              <div className="cv-preview__doc">
                <span>{cvFile.name}</span>
                <a href={cvPreviewUrl} download={cvFile.name}>
                  Download preview
                </a>
              </div>
            </div>
          )
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="notes">Anything else we should know?</label>
        <textarea id="notes" name="notes" rows={3} maxLength={5000} />
      </div>

      {/* Honeypot, leave empty */}
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

      {applyConfig.turnstileSiteKey ? (
        <div className="turnstile-wrap" ref={turnstileRef} />
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-solid" disabled={busy}>
        {busy ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

export default function Opportunities() {
  const reduceMotion = useReducedMotion();
  const { settings, isTotalSupport, pack } = useSite();
  const { section } = useCmsPage("/opportunities");
  const hero = section("page_hero")?.fields;
  const letter = section("hiring_letter")?.fields;
  const must = section("hiring_must")?.fields;
  const benefits = section("hiring_benefits")?.fields;
  const role = section("hiring_role")?.fields;
  const provided = section("hiring_provided")?.fields;
  const dockCta = section("page_cta_band")?.fields;
  const brand = hero?.brand || settings.brandName || "Total Support Care";
  const heroFb = pageHeroFallback(pack?.slug, "opportunities");

  const intro = letter?.paragraphs?.length
    ? letter.paragraphs
    : OPPORTUNITIES.intro;
  const mustHaves = must?.items?.length ? must.items : OPPORTUNITIES.mustHaves;
  const benefitItems = benefits?.items?.length
    ? benefits.items
    : OPPORTUNITIES.benefits;
  const roleCopy = role?.paragraphs?.length
    ? role.paragraphs
    : OPPORTUNITIES.role;
  const providedCopy = provided?.items?.length
    ? provided.items
    : OPPORTUNITIES.provided;
  const hrEmail = settings.hrEmail;
  const meta = pageSeoForPack("/opportunities", pack?.slug) || {
    title: `Opportunities | ${brand}`,
    description: hero?.lede || "",
  };

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-50px" },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <article className="page-jobs">
      <Seo
        title={meta.title}
        description={meta.description}
        path="/opportunities"
        image={hero?.image || OPPORTUNITIES_HERO}
        jsonLd={[
          organizationJsonLd(settings),
          webPageJsonLd({ path: "/opportunities", ...meta }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Opportunities", path: "/opportunities" },
          ]),
        ]}
      />
      <header className="hiring-poster">
        <div className="hiring-poster__media" aria-hidden="true">
          <img
            src={hero?.image || OPPORTUNITIES_HERO}
            alt={`Care careers at ${brand}, join our team`}
          />
          <div className="hiring-poster__veil" />
        </div>
        <div className="hiring-poster__copy">
          <motion.p
            className="page-brand"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {brand}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.9 }}
          >
            {hero?.title || heroFb.title}
          </motion.h1>
          <motion.p
            className="hiring-poster__motto"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            {hero?.lede || heroFb.lede}
          </motion.p>
        </div>
      </header>

      <section className="hiring-letter">
        <div className="hiring-letter__aside" aria-hidden="true">
          <span>Open letter</span>
        </div>
        <div className="hiring-letter__body">
          {intro.map((para) => (
            <motion.p key={para.slice(0, 40)} {...fade}>
              {para}
            </motion.p>
          ))}
        </div>
      </section>

      <section className="hiring-corridor" aria-labelledby="must-heading">
        <div className="hiring-corridor__inner">
          <div className="hiring-corridor__copy">
            <motion.h2 id="must-heading" {...fade}>
              {must?.title || "Before you apply"}
            </motion.h2>
            <ul className="hiring-corridor__list">
              {mustHaves.map((item) => (
                <motion.li key={item} {...fade}>
                  <span className="hiring-corridor__check" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <motion.div className="hiring-corridor__visual" {...fade}>
            <img
              src={must?.image || HIRING_INTERVIEW}
              alt="Recruiter speaking with a jobseeker during an interview"
              width={900}
              height={1200}
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      <section className="hiring-role">
        <motion.div className="hiring-role__label" {...fade}>
          <span>{role?.label || "The role"}</span>
          <h2>{role?.title || "What a day looks like"}</h2>
        </motion.div>
        <div className="hiring-role__copy">
          {roleCopy.map((para) => (
            <motion.p key={para.slice(0, 36)} {...fade}>
              {para}
            </motion.p>
          ))}
        </div>
      </section>

      <section className="hiring-provided" aria-label="What we provide">
        <div className="hiring-provided__grid">
          {providedCopy.map((item) => (
            <motion.p key={item} {...fade}>
              {item}
            </motion.p>
          ))}
        </div>
      </section>

      <section className="hiring-benefits" aria-labelledby="benefits-heading">
        <motion.h2 id="benefits-heading" {...fade}>
          {benefits?.title || "Benefits"}
        </motion.h2>
        <ul className="hiring-benefits__ribbon">
          {benefitItems.map((b) => (
            <motion.li key={b} {...fade}>
              {b}
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="hiring-dock">
        <motion.div {...fade}>
          <p className="section-kicker">Human resources</p>
          <h2>
            {dockCta?.body ||
              (isTotalSupport
                ? "Come and join the circle"
                : "Come and join the Total Support Care family")}
          </h2>
        </motion.div>
        <motion.div className="hiring-dock__channels" {...fade}>
          <a href={settings.phoneHref}>
            <span>Telephone</span>
            <strong>{settings.phoneDisplay}</strong>
          </a>
          <a href={`mailto:${hrEmail}`}>
            <span>Email</span>
            <strong>{hrEmail}</strong>
          </a>
          <p>
            <span>Address</span>
            <strong>{settings.addressLine}</strong>
          </p>
        </motion.div>
        <div className="hiring-dock__actions">
          <a className="btn btn-solid" href={`mailto:${hrEmail}`}>
            Email HR
          </a>
          <Link className="btn btn-outline" to="/contact">
            General enquiry
          </Link>
        </div>
        <div className="hiring-dock__apply">
          <ApplyForm />
        </div>
      </section>
    </article>
  );
}
