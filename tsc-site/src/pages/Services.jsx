import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import ServicesPanel from "../components/ServicesPanel";
import TscServiceCards from "../components/TscServiceCards";
import {
  AREAS_COPY,
  SERVICES_HERO,
  SUPPORT_SCENE,
} from "../data/site";
import { pageHeroFallback } from "../data/packFallbacks";
import { useCmsPage, useSite } from "../context/SiteContext";
import { cmsList } from "../lib/cmsFields";
import Seo from "../seo/Seo";
import { pageSeoForPack } from "../seo/pageMeta";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
} from "../seo/jsonLd";

function WhyIcon({ name }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "plan":
      return (
        <svg {...common}>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-3-1.5L12 20l-3-1.5L6 20V6a2 2 0 0 1 2-2z" />
          <path d="M9 9h6M9 13h6M9 17h3" />
        </svg>
      );
    case "staff":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="2.5" />
          <circle cx="16" cy="9" r="2" />
          <path d="M4.5 18c.6-2.4 2.4-3.5 4.5-3.5s3.9 1.1 4.5 3.5" />
          <path d="M13.5 18c.3-1.4 1.2-2.3 2.5-2.5 1.5-.2 2.8.6 3.5 2.5" />
        </svg>
      );
    case "dementia":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="3.5" />
          <path d="M6.5 19c1-3 3-4.5 5.5-4.5S16.5 16 17.5 19" />
          <path d="M16.5 6.5c1.2.4 2 1.5 2 2.8" />
        </svg>
      );
    case "community":
      return (
        <svg {...common}>
          <circle cx="8" cy="10" r="2.25" />
          <circle cx="16" cy="10" r="2.25" />
          <path d="M4 18c.5-2 2-3 4-3s3.5 1 4 3" />
          <path d="M12 18c.5-2 2-3 4-3s3.5 1 4 3" />
          <path d="M10.5 10h3" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M7 10.5V19h10v-8.5" />
          <path d="M10 19v-4h4v4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Services() {
  const reduceMotion = useReducedMotion();
  const { settings, isTotalSupport, pack } = useSite();
  const { section } = useCmsPage("/services");
  const hero = section("page_hero")?.fields;
  const boardSec = section("services_board");
  const board = boardSec?.fields;
  const supportSec = section("support_list");
  const support = supportSec?.fields;
  const areas = section("areas_strip")?.fields;
  const whySec = section("why_cards");
  const why = whySec?.fields;
  const pageCta = section("page_cta_band")?.fields;
  const brand = hero?.brand || settings.brandName || "Total Support Care";
  const heroFb = pageHeroFallback(pack?.slug, "services");
  const title = hero?.title || heroFb.title;
  const lede = hero?.lede || heroFb.lede;
  const heroImage = hero?.image || SERVICES_HERO;
  const meta = pageSeoForPack("/services", pack?.slug) || {
    title: `Services | ${brand}`,
    description: lede,
  };

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      };
  const services = cmsList(boardSec, "services");
  const supportItems = cmsList(supportSec, "items");
  const supportImage = support?.image || SUPPORT_SCENE;
  const whyItems = cmsList(whySec, "items");
  const areasPlaces = areas?.places
    || (isTotalSupport
      ? "Edinburgh · Loanhead · Midlothian"
      : "Coventry · Nuneaton · Hinckley");
  const whyTitle = why?.title
    || (isTotalSupport ? "Why Total Support Care" : "Why Choose Total Support Care");
  const whyLede = why?.lede
    || (isTotalSupport
      ? "We believe everyone deserves to feel safe, valued and supported at home. Our approach is calm, precise and human, because no two people need the same care."
      : "At Total Support Care, we believe that everyone deserves to feel safe, valued, respected, and supported in the comfort of their own home. Our approach to care is personal, compassionate, and centred around the individual, because no two people or families have the same needs.");
  const whyClose = why?.close
    || (isTotalSupport
      ? "We don’t sell a menu of extras. We build one complete plan around you, and stay in the circle with your family."
      : "At Total Support Care, we don't simply provide care, we build relationships, provide reassurance, and become a trusted part of the support network around each individual and their family.");

  return (
    <article className="page-services">
      <Seo
        title={meta.title}
        description={meta.description}
        path="/services"
        image={heroImage}
        jsonLd={[
          organizationJsonLd(settings),
          webPageJsonLd({ path: "/services", ...meta }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ]}
      />
      <header className="svc-page-hero">
        <div className="svc-page-hero__media" aria-hidden="true">
          <img
            src={heroImage}
            alt={`${brand} home care and personal support services`}
          />
          <div className="svc-page-hero__veil" />
        </div>
        <div className="svc-page-hero__copy">
          <motion.p
            className="page-brand"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {brand}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="svc-page-hero__lede"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            {lede}
          </motion.p>
        </div>
      </header>

      <section className="svc-page-board section section-paper">
        <div className="section-inner svc-page-board__head-wrap">
          <motion.div className="svc-page-board__head" {...fade}>
            <p className="section-kicker">{board?.kicker || "Choose a chapter"}</p>
            <h2 className="section-title">
              {board?.title || "Five ways we show up at home"}
            </h2>
          </motion.div>
        </div>
        <motion.div className="svc-page-board__showcase" {...fade}>
          {isTotalSupport ? (
            <TscServiceCards services={services} />
          ) : (
            <ServicesPanel services={services} />
          )}
        </motion.div>
      </section>

      <section className="svc-support-folio" aria-labelledby="support-heading">
        <div className="svc-support-folio__inner">
          <motion.div className="svc-support-folio__intro" {...fade}>
            <p className="section-kicker">
              {support?.kicker || "Day to day"}
            </p>
            <h2 id="support-heading">
              {support?.title || "Services we can support in"}
            </h2>
            {support?.lead ? (
              <p className="svc-support-folio__lede">{support.lead}</p>
            ) : null}
          </motion.div>

          <div className="svc-support-folio__layout">
            <motion.div className="svc-support-folio__visual" {...fade}>
              <img
                src={supportImage}
                alt="Family and carers supporting an older adult at home"
                width={1200}
                height={900}
                loading="lazy"
              />
            </motion.div>

            <ul className="svc-support-folio__grid">
              {supportItems.map((item, i) => (
                <motion.li
                  key={item}
                  {...fade}
                  transition={{
                    ...fade.transition,
                    delay: reduceMotion ? 0 : Math.min(i * 0.03, 0.35),
                  }}
                >
                  <span className="svc-support-folio__tick" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="svc-areas-strip">
        <motion.p {...fade}>{areas?.copy || AREAS_COPY}</motion.p>
        <p className="svc-areas-strip__places">{areasPlaces}</p>
        <hr className="svc-areas-strip__rule" />
      </section>

      <section className="svc-why" aria-labelledby="why-heading">
        <div className="svc-why__head">
          <motion.p className="section-kicker" {...fade}>
            {why?.kicker || "Why families stay"}
          </motion.p>
          <motion.h2 id="why-heading" {...fade}>
            {whyTitle}
          </motion.h2>
          <motion.p className="svc-why__lede" {...fade}>
            {whyLede}
          </motion.p>
        </div>
        <ul className="svc-why__list">
          {whyItems.map((item) => (
            <motion.li key={item.title} className="svc-why__item" {...fade}>
              <div className="svc-why__title-row">
                <span className="svc-why__icon">
                  <WhyIcon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
            </motion.li>
          ))}
        </ul>
        <motion.p className="svc-why__close" {...fade}>
          {whyClose}
        </motion.p>
      </section>

      {pageCta?.body || pageCta?.primaryCta ? (
        <section
          className={`page-cta-band${
            pageCta?.variant === "teal" ? " page-cta-band--teal" : ""
          }`}
        >
          {pageCta?.body ? <p>{pageCta.body}</p> : null}
          <div className="page-cta-band__actions">
            {pageCta?.primaryCta?.to ? (
              <Link className="btn btn-primary" to={pageCta.primaryCta.to}>
                {pageCta.primaryCta.label}
              </Link>
            ) : null}
            {pageCta?.secondaryCta?.to ? (
              <Link className="btn btn-ghost" to={pageCta.secondaryCta.to}>
                {pageCta.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </article>
  );
}
