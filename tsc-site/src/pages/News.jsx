import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { NEWS } from "../data/site";
import { pageHeroFallback } from "../data/packFallbacks";
import { useCmsPage, useSite } from "../context/SiteContext";
import Seo from "../seo/Seo";
import { pageSeoForPack } from "../seo/pageMeta";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
} from "../seo/jsonLd";

export default function News() {
  const reduceMotion = useReducedMotion();
  const { settings, isTotalSupport, pack } = useSite();
  const { section } = useCmsPage("/news");
  const masthead = section("news_masthead")?.fields;
  const list = section("news_list")?.fields;
  const entries = list?.entries?.length ? list.entries : NEWS;
  const [featured, ...rest] = entries;
  const brand = masthead?.brand || settings.brandName || "Total Support Care";
  const heroFb = pageHeroFallback(pack?.slug, "news");
  const pageCta = section("page_cta_band")?.fields;
  const locality =
    masthead?.locality || (isTotalSupport ? "Edinburgh" : "Coventry");
  const metaLabel = masthead?.metaLabel || "Field notes";
  const newsTitle = masthead?.title || heroFb.title;
  const newsSubtitle = masthead?.subtitle || heroFb.lede;
  const meta = pageSeoForPack("/news", pack?.slug) || {
    title: `News | ${brand}`,
    description: newsSubtitle,
  };

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <article className="page-news">
      <Seo
        title={meta.title}
        description={meta.description}
        path="/news"
        image="/og-default.jpg"
        jsonLd={[
          organizationJsonLd(settings),
          webPageJsonLd({ path: "/news", ...meta }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
          ]),
        ]}
      />
      <header className="diary-masthead">
        <div className="diary-masthead__inner">
          <motion.p
            className="page-brand"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {brand}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {newsTitle}
          </motion.h1>
          <motion.p
            className="diary-masthead__sub"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {newsSubtitle}
          </motion.p>
          <div className="diary-masthead__meta" aria-hidden="true">
            <span>{metaLabel}</span>
            <span>·</span>
            <span>{entries.length} entries</span>
            <span>·</span>
            <span>{locality}</span>
          </div>
        </div>
      </header>

      {featured ? (
        <section className="diary-feature" aria-labelledby="featured-title">
          <motion.div className="diary-feature__date" {...fade}>
            <span className="diary-feature__tag">{featured.tag}</span>
            <time dateTime={featured.date}>{featured.label}</time>
          </motion.div>
          <motion.div className="diary-feature__body" {...fade}>
            <h2 id="featured-title">{featured.title}</h2>
            <p>{featured.excerpt}</p>
          </motion.div>
        </section>
      ) : null}

      <section className="diary-spine" aria-label="Archive">
        <div className="diary-spine__line" aria-hidden="true" />
        <ul className="diary-spine__list">
          {rest.map((entry, i) => (
            <motion.li key={`${entry.date}-${entry.title}`} {...fade}>
              <div className="diary-spine__node" aria-hidden="true">
                <span />
              </div>
              <div className="diary-spine__entry">
                <div className="diary-spine__meta">
                  <time dateTime={entry.date}>{entry.label}</time>
                  <span className="diary-spine__tag">{entry.tag}</span>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.excerpt}</p>
              </div>
              <span className="diary-spine__num" aria-hidden="true">
                {String(i + 2).padStart(2, "0")}
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      {pageCta?.body || pageCta?.primaryCta ? (
        <section className="page-cta-band">
          {pageCta?.body ? <p>{pageCta.body}</p> : null}
          <div className="page-cta-band__actions">
            {pageCta?.primaryCta?.to ? (
              <Link className="btn btn-solid" to={pageCta.primaryCta.to}>
                {pageCta.primaryCta.label}
              </Link>
            ) : null}
            {pageCta?.secondaryCta?.to ? (
              <Link className="btn btn-outline" to={pageCta.secondaryCta.to}>
                {pageCta.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </article>
  );
}
