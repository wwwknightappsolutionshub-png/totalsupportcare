import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ABOUT_HERO } from "../data/site";
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

export default function About() {
  const reduceMotion = useReducedMotion();
  const { settings, pack } = useSite();
  const { section } = useCmsPage("/about");
  const hero = section("page_hero")?.fields;
  const missionSec = section("about_mission");
  const mission = missionSec?.fields;
  const pullSec = section("pull_quote");
  const pull = pullSec?.fields;
  const togetherSec = section("principles_ledger");
  const together = togetherSec?.fields;
  const promiseSec = section("promise");
  const promise = promiseSec?.fields;
  const teamSec = section("leadership");
  const pageCta = section("page_cta_band")?.fields;

  const brand = hero?.brand || settings.brandName || "Total Support Care";
  const heroFb = pageHeroFallback(pack?.slug, "about");
  const title = hero?.title || heroFb.title;
  const lede = hero?.lede || heroFb.lede;
  const heroImage = hero?.image || ABOUT_HERO;
  const missionTitle = mission?.title || "";
  const missionParas = cmsList(missionSec, "paragraphs");
  const pullQuote = pullSec ? pull?.quote || "" : "";
  const togetherKicker = together?.kicker || "";
  const togetherItems = cmsList(togetherSec, "items");
  const promiseBody = promiseSec ? promise?.body || "" : "";
  // No hardcoded team when CMS leadership is off/empty
  const members = cmsList(teamSec, "members");
  const phoneHref = settings.phoneHref;

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      };

  const meta = pageSeoForPack("/about", pack?.slug) || {
    title: `About | ${brand}`,
    description: lede,
  };

  return (
    <article className="page-about">
      <Seo
        title={meta.title}
        description={meta.description}
        path="/about"
        image={heroImage}
        jsonLd={[
          organizationJsonLd(settings),
          webPageJsonLd({ path: "/about", ...meta }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <header className="manifesto-hero">
        <div className="manifesto-hero__media" aria-hidden="true">
          <motion.img
            src={heroImage}
            alt={`${brand} domiciliary care supporting someone at home`}
            initial={reduceMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="manifesto-hero__veil" />
        </div>
        <div className="manifesto-hero__copy">
          <motion.p
            className="page-brand"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {brand}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="manifesto-hero__lede"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.22 }}
          >
            {lede}
          </motion.p>
        </div>
      </header>

      <section className="manifesto-read">
        <div className="manifesto-read__rail" aria-hidden="true">
          <span>Quality of life</span>
          <span>Quality of life</span>
          <span>Quality of life</span>
        </div>
        <div className="manifesto-read__column">
          <motion.h2 {...fade}>{missionTitle}</motion.h2>
          {missionParas.map((para) => (
            <motion.p key={para.slice(0, 40)} {...fade}>
              {para}
            </motion.p>
          ))}
        </div>
      </section>

      <aside className="manifesto-pull" aria-label="Belief">
        <motion.blockquote {...fade}>
          <p>{pullQuote}</p>
        </motion.blockquote>
      </aside>

      {togetherSec ? (
        <section
          className="tsc-orbit"
          aria-labelledby="tsc-orbit-heading"
        >
          <h2 id="tsc-orbit-heading" className="visually-hidden">
            {[together?.titleLine1, together?.titleLine2]
              .filter(Boolean)
              .join(" ") || togetherKicker || "Our circle"}
          </h2>
          <div className="tsc-orbit__shell">
            <div className="tsc-orbit__intro">
              <motion.div
                className="tsc-orbit__emblem"
                aria-hidden="true"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <svg className="tsc-orbit__ring" viewBox="0 0 320 320">
                  <motion.circle
                    cx="160"
                    cy="160"
                    r="118"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeDasharray="5 9"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.35"
                  />
                  <circle cx="160" cy="42" r="4" fill="currentColor" className="tsc-orbit__pip" />
                  <circle cx="278" cy="160" r="4" fill="currentColor" className="tsc-orbit__pip" />
                  <circle cx="160" cy="278" r="4" fill="currentColor" className="tsc-orbit__pip" />
                  <circle cx="42" cy="160" r="4" fill="currentColor" className="tsc-orbit__pip" />
                </svg>
                <div className="tsc-orbit__core">
                  <span className="tsc-orbit__core-label">One plan</span>
                </div>
              </motion.div>
            </div>

            <ol className="tsc-orbit__list">
              {togetherItems.map((item, i) => (
                <motion.li
                  key={item.title}
                  className="tsc-orbit__item"
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.55,
                    delay: reduceMotion ? 0 : 0.08 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="tsc-orbit__idx" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="tsc-orbit__copy">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {promiseSec && promiseBody ? (
        <section className="manifesto-promise">
          <motion.div className="manifesto-promise__mark" {...fade}>
            <span>Our</span>
            <strong>promise</strong>
          </motion.div>
          <motion.p {...fade}>{promiseBody}</motion.p>
        </section>
      ) : null}

      {teamSec && members.length ? (
      <section className="manifesto-faces">
        <div className="manifesto-faces__inner">
          <motion.div className="manifesto-faces__intro" {...fade}>
            <p className="section-kicker">
              {teamSec.fields?.kicker || "Who leads the work"}
            </p>
            <h2>{teamSec.fields?.title || "Familiar leadership"}</h2>
          </motion.div>
          <div className="manifesto-faces__grid">
            {members.map((member, i) => (
              <motion.article
                key={member.name}
                className="manifesto-face"
                {...fade}
                transition={{
                  ...fade.transition,
                  delay: reduceMotion ? 0 : i * 0.12,
                }}
              >
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    width={300}
                    height={300}
                  />
                ) : null}
                <div className="manifesto-face__copy">
                  <p className="manifesto-face__role">{member.role}</p>
                  <h3>{member.name}</h3>
                  <p>{member.bio}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {pageCta?.body || pageCta?.primaryCta ? (
        <section className="page-cta-band">
          {pageCta?.body ? <p>{pageCta.body}</p> : null}
          <div className="page-cta-band__actions">
            {pageCta?.primaryCta?.to ? (
              pageCta.primaryCta.to.startsWith("tel:") ||
              pageCta.primaryCta.to.startsWith("mailto:") ? (
                <a className="btn btn-solid" href={pageCta.primaryCta.to}>
                  {pageCta.primaryCta.label}
                </a>
              ) : (
                <Link className="btn btn-solid" to={pageCta.primaryCta.to}>
                  {pageCta.primaryCta.label}
                </Link>
              )
            ) : null}
            {pageCta?.secondaryCta?.to ? (
              pageCta.secondaryCta.to.startsWith("tel:") ||
              pageCta.secondaryCta.to.startsWith("mailto:") ? (
                <a className="btn btn-outline" href={pageCta.secondaryCta.to}>
                  {pageCta.secondaryCta.label}
                </a>
              ) : (
                <Link className="btn btn-outline" to={pageCta.secondaryCta.to}>
                  {pageCta.secondaryCta.label}
                </Link>
              )
            ) : (
              <a className="btn btn-outline" href={phoneHref}>
                Call us
              </a>
            )}
          </div>
        </section>
      ) : null}
    </article>
  );
}
