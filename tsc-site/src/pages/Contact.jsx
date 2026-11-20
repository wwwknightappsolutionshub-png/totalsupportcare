import { motion, useReducedMotion } from "framer-motion";
import ContactForm from "../components/ContactForm";
import { CONTACT_HERO } from "../data/site";
import { pageHeroFallback } from "../data/packFallbacks";
import { useCmsPage, useSite } from "../context/SiteContext";
import Seo from "../seo/Seo";
import { pageSeoForPack } from "../seo/pageMeta";
import {
  breadcrumbJsonLd,
  contactPageJsonLd,
  organizationJsonLd,
  webPageJsonLd,
} from "../seo/jsonLd";

export default function Contact() {
  const reduceMotion = useReducedMotion();
  const { settings, isTotalSupport, pack } = useSite();
  const { section } = useCmsPage("/contact");
  const hero = section("page_hero")?.fields;
  const brand = hero?.brand || settings.brandName || "Total Support Care";
  const heroFb = pageHeroFallback(pack?.slug, "contact");
  const title = hero?.title || heroFb.title;
  const lede = hero?.lede || heroFb.lede;
  const meta = pageSeoForPack("/contact", pack?.slug) || {
    title: `Contact | ${brand}`,
    description: lede,
  };

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <article className="page-contact">
      <Seo
        title={meta.title}
        description={meta.description}
        path="/contact"
        image={hero?.image || CONTACT_HERO}
        jsonLd={[
          organizationJsonLd(settings),
          webPageJsonLd({ path: "/contact", ...meta }),
          contactPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <header className="contact-dock-hero">
        <div className="contact-dock-hero__bg" aria-hidden="true">
          <img
            src={hero?.image || CONTACT_HERO}
            alt={`Family speaking with a ${brand} carer`}
          />
          <div className="contact-dock-hero__veil" />
        </div>
        <div className="contact-dock-hero__inner">
          <motion.p
            className="page-brand"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
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
            className="contact-dock-hero__note"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {lede}
          </motion.p>
        </div>
      </header>

      <section className="contact-number-wall" aria-label="Call us">
        <motion.a
          href={settings.phoneHref}
          className="contact-number-wall__primary"
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>Telephone</span>
          <strong>{settings.phoneDisplay}</strong>
        </motion.a>
        {settings.phoneAltHref && settings.phoneAltDisplay ? (
          <motion.a
            href={settings.phoneAltHref}
            className="contact-number-wall__alt"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Also {settings.phoneAltDisplay}
          </motion.a>
        ) : null}
      </section>

      <section className="contact-dock">
        <motion.aside className="contact-dock__channels" {...fade}>
          <h2>Channels</h2>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </dd>
            </div>
            <div>
              <dt>Visit</dt>
              <dd>{settings.addressShort}</dd>
            </div>
            {settings.cqcUrl ? (
              <div>
                <dt>Regulation</dt>
                <dd>
                  <a href={settings.cqcUrl} target="_blank" rel="noreferrer">
                    CQC registration details
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="contact-dock__reassure">
            No call centres. No scripts. A person from {brand} will reply.
          </p>
        </motion.aside>

        <motion.div className="contact-dock__form" {...fade}>
          <h2>Write to us</h2>
          <ContactForm variant="dock" />
        </motion.div>
      </section>
    </article>
  );
}
