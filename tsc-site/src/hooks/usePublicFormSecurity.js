import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

/**
 * Shared Turnstile + public form timing config for contact / apply style forms.
 */
export function usePublicFormSecurity({ theme = "light" } = {}) {
  const [formConfig, setFormConfig] = useState({
    captchaRequired: false,
    turnstileSiteKey: null,
    minSubmitMs: 3000,
  });
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    const load = api.getFormConfig || api.getApplyConfig;
    load()
      .then(setFormConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formConfig.turnstileSiteKey) return undefined;
    const siteKey = formConfig.turnstileSiteKey;

    function renderWidget() {
      if (!window.turnstile || !turnstileRef.current) return;
      if (widgetIdRef.current != null) return;
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        theme,
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
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.kerryTurnstile = "1";
    script.addEventListener("load", renderWidget);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", renderWidget);
  }, [formConfig.turnstileSiteKey, theme]);

  function getCaptchaToken() {
    if (!formConfig.captchaRequired) return "";
    if (!window.turnstile || widgetIdRef.current == null) return "";
    return window.turnstile.getResponse(widgetIdRef.current) || "";
  }

  function resetCaptcha() {
    if (window.turnstile && widgetIdRef.current != null) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  return {
    formConfig,
    turnstileRef,
    getCaptchaToken,
    resetCaptcha,
  };
}
