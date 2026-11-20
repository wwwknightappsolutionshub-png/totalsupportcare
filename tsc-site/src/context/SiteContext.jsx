import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import * as fallback from "../data/site";

const SiteContext = createContext(null);

const FALLBACK_SETTINGS = {
  brandName: "Total Support Care",
  logo: "/packs/totalsupport-icon.svg",
  logoFull: "/packs/totalsupport-logo.svg",
  phoneDisplay: "07522 347972",
  phoneHref: "tel:+447522347972",
  phoneAltDisplay: "",
  phoneAltHref: "",
  email: "info@totalsupportcare.co.uk",
  hrEmail: "info@totalsupportcare.co.uk",
  addressLine: "6 Dryden Rd, Loanhead, EH20 9LZ",
  addressShort: "Loanhead, EH20 9LZ · Edinburgh",
  cqcUrl: "",
  nav: fallback.NAV,
  marketplaceEnabled: false,
  pack: {
    slug: "totalsupport",
    name: "Total Support Care",
    niche: "care",
    theme: {
      id: "totalsupport",
      colors: {
        primary: "#0B1F2E",
        accent: "#E3A93B",
        bg: "#F3EFE8",
        paper: "#F3EFE8",
        ink: "#0B1F2E",
      },
    },
  },
};

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [ready, setReady] = useState(false);
  const [cmsOnline, setCmsOnline] = useState(false);

  async function refreshSettings() {
    const data = await api.getSettings();
    setSettings((prev) => ({ ...prev, ...data }));
    setCmsOnline(true);
    return data;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getSettings();
        if (!cancelled) {
          setSettings((prev) => ({ ...prev, ...data }));
          setCmsOnline(true);
        }
      } catch {
        if (!cancelled) setCmsOnline(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pack = settings.pack || FALLBACK_SETTINGS.pack;
  const isKerry = false;
  const isCarePack = true;
  const isTotalSupport = true;
  const marketplaceEnabled = false;

  useEffect(() => {
    if (pack?.slug) {
      document.documentElement.setAttribute("data-pack", pack.slug);
    }
  }, [pack?.slug]);

  return (
    <SiteContext.Provider
      value={{
        settings,
        ready,
        cmsOnline,
        pack,
        isKerry,
        isCarePack,
        isTotalSupport,
        marketplaceEnabled,
        refreshSettings,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite requires SiteProvider");
  return ctx;
}

export function useCmsPage(path) {
  const { pack } = useSite();
  const packSlug = pack?.slug || "";
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(null);
    (async () => {
      try {
        const data = await api.getPage(path);
        if (!cancelled) {
          setPage(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setPage(null);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, packSlug]);

  const section = (type) =>
    page?.sections?.find((s) => s.type === type && s.enabled !== false) || null;

  return { page, loading, error, section, sections: page?.sections || [] };
}
