import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import GoogleTagManager from "./GoogleTagManager";
import WhatsAppWidget from "./WhatsAppWidget";

function applyPackTheme(pack) {
  const root = document.documentElement;
  const theme = pack?.theme;
  const clearInline = () => {
    [
      "--teal-900",
      "--teal-800",
      "--teal-700",
      "--teal-600",
      "--rose-500",
      "--rose-300",
      "--rose-100",
      "--mist",
      "--mist-deep",
      "--paper",
      "--ink",
      "--ink-soft",
      "--line",
      "--font-display",
      "--font-body",
      "--tsc-ink",
      "--tsc-teal",
      "--tsc-linen",
      "--tsc-linen-deep",
      "--tsc-gold",
      "--tsc-muted",
    ].forEach((k) => root.style.removeProperty(k));
  };

  if (!theme?.colors || !pack?.slug) {
    root.removeAttribute("data-pack");
    clearInline();
    return;
  }

  root.setAttribute("data-pack", pack.slug);
  // TSC palette is owned by totalsupport.css via html[data-pack]; avoid fighting it.
  if (pack.slug === "totalsupport") {
    clearInline();
    return;
  }

  const c = theme.colors;
  if (c.primary) {
    root.style.setProperty("--teal-900", c.primary);
    root.style.setProperty("--teal-800", c.secondary || c.primary);
    root.style.setProperty("--teal-700", c.secondary || c.primary);
    root.style.setProperty("--teal-600", c.secondary || c.primary);
  }
  if (c.accent) {
    root.style.setProperty("--rose-500", c.accent);
    root.style.setProperty("--rose-300", c.accent);
    root.style.setProperty("--rose-100", c.bg || "#F3EFE8");
  }
  if (c.bg) {
    root.style.setProperty("--mist", c.bg);
    root.style.setProperty("--mist-deep", c.bg);
  }
  if (c.paper) root.style.setProperty("--paper", c.paper);
  if (c.ink) {
    root.style.setProperty("--ink", c.ink);
    root.style.setProperty("--ink-soft", c.muted || c.ink);
    root.style.setProperty("--line", `${c.ink}1f`);
  }
  if (theme.fontDisplay) {
    root.style.setProperty(
      "--font-display",
      `"${theme.fontDisplay}", system-ui, sans-serif`
    );
  }
  if (theme.fontBody) {
    root.style.setProperty(
      "--font-body",
      `"${theme.fontBody}", system-ui, sans-serif`
    );
  }
}

export default function Layout() {
  const { settings, pack, isTotalSupport } = useSite();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const nav = settings.nav || [];
  const logo = settings.logo;
  const phoneDisplay = settings.phoneDisplay;
  const phoneHref = settings.phoneHref;
  const email = settings.email;
  const brand = settings.brandName || pack?.name || "Total Support Care";
  const tagline = settings.tagline || "Care as individual as you.";
  const siteUrl =
    (import.meta.env.VITE_SITE_URL || "https://totalsupportcare.co.uk").replace(
      /\/$/,
      ""
    );
  const regionLine = "Scotland, United Kingdom";

  useEffect(() => {
    applyPackTheme(pack);
    // Do not clear data-pack on cleanup — StrictMode remounts and pack switches
    // briefly drop the attribute, which flashes Kerry tokens over TSC layouts.
  }, [pack]);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    setMenuOpen(false);
    if (isHome && window.location.hash && window.location.hash !== "#top") {
      history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, [location.pathname, isHome]);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return undefined;
    }
    // Hysteresis stops flicker at the threshold; TSC uses a lower band
    // because the split hero is shorter than a full-bleed viewport.
    const enterAt = isTotalSupport ? 72 : window.innerHeight * 0.55;
    const exitAt = isTotalSupport ? 24 : window.innerHeight * 0.4;
    let locked = window.scrollY > enterAt;
    setScrolled(locked);

    const onScroll = () => {
      const y = window.scrollY;
      if (!locked && y > enterAt) {
        locked = true;
        setScrolled(true);
      } else if (locked && y < exitAt) {
        locked = false;
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome, location.pathname, isTotalSupport]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!isTotalSupport || reduceMotion) return undefined;

    const root = document.querySelector(".site-shell--totalsupport");
    if (!root) return undefined;

    // Hero copy is handled by Framer Motion — exclude it so the two
    // systems don't fight and make the entrance feel abrupt.
    const all = root.querySelectorAll("main :is(h1, h2, h3)");
    if (!all.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("tsc-reveal-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    all.forEach((el) => {
      if (el.closest(".hero")) return;
      el.classList.add("tsc-reveal");
      io.observe(el);
    });

    return () => {
      io.disconnect();
      all.forEach((el) => {
        el.classList.remove("tsc-reveal", "tsc-reveal-in");
      });
    };
  }, [isTotalSupport, reduceMotion, location.pathname]);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  const headerTone = isHome && !scrolled ? "is-hero" : "is-scrolled";
  const shellClass = [
    "site-shell",
    isTotalSupport ? "site-shell--totalsupport" : "site-shell--kerry",
  ].join(" ");

  return (
    <div id="top" className={shellClass}>
      <GoogleTagManager containerId={settings.gtmContainerId} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className={`site-header ${headerTone}`}>
        <div className="header-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <img
              src={logo}
              alt=""
              width={42}
              height={42}
              decoding="async"
            />
            {isTotalSupport ? (
              <span className="brand__text">
                <span className="brand__name">{brand}</span>
                <span className="brand__tag">{tagline}</span>
              </span>
            ) : (
              brand
            )}
          </Link>

          <nav className="nav-desktop" aria-label="Primary">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "is-active" : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <WhatsAppWidget />
            <a className="header-cta" href={phoneHref}>
              Call {phoneDisplay}
            </a>
            <button
              className="menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav className="nav-mobile open" aria-label="Mobile">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
          <a
            className="phone-link"
            href={phoneHref}
            onClick={() => setMenuOpen(false)}
          >
            Call {phoneDisplay}
          </a>
        </nav>
      )}

      <main id="main">
        <Outlet />
      </main>

      <button
        type="button"
        className={`scroll-top ${scrolled || !isHome ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <span aria-hidden="true">↑</span>
      </button>

      <footer
        className={`site-footer${isTotalSupport ? " site-footer--tsc" : ""}`}
      >
        {isTotalSupport ? (
          <div className="footer-inner tsc-footer">
            <div className="tsc-footer__top">
              <Link to="/" className="tsc-footer__brand">
                <img src={logo} alt="" width={28} height={28} />
                <span>
                  <strong>{brand}</strong>
                  <em>{tagline}</em>
                </span>
              </Link>
              <nav className="tsc-footer__nav" aria-label="Footer">
                {nav.map((item) => (
                  <Link key={item.to} to={item.to}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="tsc-footer__mid">
              <p>{settings.addressLine}</p>
              <a href={phoneHref}>{phoneDisplay}</a>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <div className="tsc-footer__base">
              <span>
                © {new Date().getFullYear()} {brand}
              </span>
              <a href={siteUrl} target="_blank" rel="noreferrer">
                totalsupportcare.co.uk
              </a>
            </div>
          </div>
        ) : (
          <div className="footer-inner">
            <p className="footer-brand">{brand}</p>
            <div className="footer-grid">
              <div>
                <h3>Visit</h3>
                <p>{settings.addressLine}</p>
                <p>{regionLine}</p>
              </div>
              <div>
                <h3>Explore</h3>
                {nav.map((item) => (
                  <Link key={item.to} to={item.to}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div>
                <h3>Connect</h3>
                <a href={phoneHref}>{phoneDisplay}</a>
                <a href={`mailto:${email}`}>{email}</a>
                <a href={siteUrl} target="_blank" rel="noreferrer">
                  Live site
                </a>
              </div>
            </div>
            <div className="footer-meta">
              <span>
                © {new Date().getFullYear()} {brand}.
              </span>
              <span>{tagline}</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
