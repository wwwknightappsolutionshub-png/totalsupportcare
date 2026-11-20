import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import ContactForm from "../components/ContactForm";
import HeroMediaSlider from "../components/HeroMediaSlider";
import ReviewsCarousel from "../components/ReviewsCarousel";
import ServicesPanel from "../components/ServicesPanel";
import TscServiceCards from "../components/TscServiceCards";
import TscSupportMatrix from "../components/TscSupportMatrix";
import {
  APPROACH_IMG,
  AREAS_COPY,
  DIFFERENCE_COPY,
  DIFFERENCE_IMG,
  HERO_IMG,
  KERRY_PHOTO,
  NICOLE_PHOTO,
  REVIEWS,
  SERVICES_INTRO,
  SUPPORT_ITEMS,
  SUPPORT_SCENE,
} from "../data/site";
import { useCmsPage, useSite } from "../context/SiteContext";
import Seo from "../seo/Seo";
import { pageSeoForPack } from "../seo/pageMeta";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "../seo/jsonLd";

export default function Home() {
  const reduceMotion = useReducedMotion();
  const { settings, isTotalSupport, pack } = useSite();
  const { section } = useCmsPage("/");
  const hero = section("home_hero")?.fields;
  const servicesIntro = section("rich_text")?.fields;
  const servicesBoard = section("services_board")?.fields;
  const support = section("support_list")?.fields;
  const areas = section("areas_strip")?.fields;
  const approach = section("approach_steps")?.fields;
  const difference = section("difference_block")?.fields;
  const circle = section("brand_circle")?.fields;
  const leadership = section("leadership")?.fields;
  const reviewsSec = section("home_reviews")?.fields;
  const homeContact = section("home_contact")?.fields;
  const meta = pageSeoForPack("/", pack?.slug) || {
    title: settings.brandName || "Home",
    description: hero?.lead || "",
  };
  // TSC may use CMS split layout when configured.
  const heroLayout = isTotalSupport
    ? hero?.layout || "split"
    : "fullbleed";
  const headline = hero?.headline || "";
  const headlineParts =
    isTotalSupport && headline.includes("Nothing generic")
      ? headline.split(/(Nothing generic\.?)/)
      : null;
  const heroSlides =
    hero?.slides?.filter((s) => s?.src)?.length > 0
      ? hero.slides.filter((s) => s?.src)
      : hero?.image
        ? [{ src: hero.image, label: "Featured care" }]
        : [];
  const primaryCta = hero?.primaryCta || {
    label: "Enquire about care",
    to: "/contact",
  };
  const secondaryCta = hero?.secondaryCta || {
    label: "Call us today",
    to: settings.phoneHref,
  };
  const boardServices = servicesBoard?.services?.length
    ? servicesBoard.services
    : [];
  const supportItems = support?.items?.length
    ? support.items
    : isTotalSupport
      ? []
      : SUPPORT_ITEMS;
  const supportImage = support?.image || SUPPORT_SCENE;
  const placesList = areas?.placesList?.length
    ? areas.placesList
    : (areas?.places || "")
        .split(/[·|,]/)
        .map((p) => p.trim())
        .filter(Boolean);
  const approachSteps = approach?.steps?.length ? approach.steps : [];
  const approachImage = approach?.image || APPROACH_IMG;
  const differenceParas = difference?.paragraphs?.length
    ? difference.paragraphs
    : isTotalSupport
      ? []
      : DIFFERENCE_COPY;
  const circleOrbs = isTotalSupport && circle?.orbs?.length ? circle.orbs : [];
  const teamMembers = leadership?.members?.length ? leadership.members : [];
  const reviewItems = reviewsSec?.items?.length ? reviewsSec.items : REVIEWS;
  const orbClass = ["a", "b", "c"];

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <>
      <Seo
        title={meta.title}
        description={meta.description}
        path="/"
        image={hero?.image || "/og-default.jpg"}
        jsonLd={[
          organizationJsonLd(settings),
          websiteJsonLd(),
          webPageJsonLd({ path: "/", ...meta }),
          breadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
      <section
        className={`hero hero--${heroLayout}${isTotalSupport ? " hero--tsc" : ""}`}
        aria-label="Introduction"
      >
        <div className="hero-media" aria-hidden={isTotalSupport ? undefined : "true"}>
          {isTotalSupport ? (
            <>
              <HeroMediaSlider slides={heroSlides} />
              <div className="hero-rings" aria-hidden="true" />
            </>
          ) : (
            <>
              <motion.div
                className="hero-media__frame"
                initial={reduceMotion ? false : { scale: 1.14 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <img
                  src={hero?.image || HERO_IMG}
                  alt="Carer supporting an older adult at home"
                  width={2000}
                  height={1333}
                  fetchPriority="high"
                />
              </motion.div>
              <div className="hero-shade" />
              <div className="hero-glow hero-glow--a" />
              <div className="hero-glow hero-glow--b" />
              <div className="hero-grain" />
              <div className="hero-sheen" />
            </>
          )}
        </div>

        <div className="hero-content">
          <motion.p
            className="hero-brand"
            initial={
              reduceMotion
                ? false
                : isTotalSupport
                  ? { opacity: 0, y: 18 }
                  : { opacity: 0, y: 36, filter: "blur(8px)" }
            }
            animate={
              isTotalSupport
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            transition={
              isTotalSupport
                ? { duration: 1.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {hero?.brand || settings.brandName || "Total Support Care"}
          </motion.p>
          <motion.h1
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: isTotalSupport ? 32 : 28 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              isTotalSupport
                ? { duration: 1.75, delay: 0.55, ease: [0.16, 1, 0.3, 1] }
                : {
                    duration: 0.8,
                    delay: 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          >
            {headlineParts
              ? headlineParts.map((part, i) =>
                  part.startsWith("Nothing generic") ? (
                    <span key={i} className="hero-accent-word">
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )
              : headline}
          </motion.h1>
          <motion.p
            className="hero-lead"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: isTotalSupport ? 20 : 22 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              isTotalSupport
                ? { duration: 1.4, delay: 1.05, ease: [0.22, 1, 0.36, 1] }
                : {
                    duration: 0.75,
                    delay: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          >
            {hero?.lead || ""}
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: isTotalSupport ? 16 : 18 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              isTotalSupport
                ? { duration: 1.2, delay: 1.4, ease: [0.22, 1, 0.36, 1] }
                : {
                    duration: 0.7,
                    delay: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          >
            {primaryCta?.to?.startsWith("tel:") ||
            primaryCta?.to?.startsWith("mailto:") ? (
              <a className="btn btn-primary hero-btn" href={primaryCta.to}>
                {primaryCta.label}
              </a>
            ) : (
              <Link className="btn btn-primary hero-btn" to={primaryCta.to || "/contact"}>
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta?.to?.startsWith("tel:") ||
            secondaryCta?.to?.startsWith("mailto:") ? (
              <a className="btn btn-ghost hero-btn" href={secondaryCta.to}>
                {secondaryCta.label}
              </a>
            ) : (
              <Link className="btn btn-ghost hero-btn" to={secondaryCta.to || settings.phoneHref}>
                {secondaryCta.label}
              </Link>
            )}
          </motion.div>
        </div>

        <a
          className="hero-scroll"
          href="#services"
          aria-label="Scroll to services"
        >
          <span className="hero-scroll__line" />
          <span className="hero-scroll__label">Scroll</span>
        </a>
      </section>

      <section id="services" className="section section-paper services-section">
        <div className="section-inner">
          <motion.div className="services-section__intro" {...fadeUp}>
            <p className="section-kicker">
              {servicesIntro?.kicker || servicesBoard?.kicker || ""}
            </p>
            <h2 className="section-title">
              {servicesIntro?.title || servicesBoard?.title || ""}
            </h2>
            <p className="section-lead">
              {servicesIntro?.body || SERVICES_INTRO}
            </p>
          </motion.div>

          <motion.div {...fadeUp}>
            {isTotalSupport ? (
              <TscServiceCards services={boardServices} />
            ) : (
              <ServicesPanel services={boardServices} />
            )}
          </motion.div>

          {!isTotalSupport && supportItems.length ? (
            <motion.div className="services-support" {...fadeUp}>
              <div className="services-support__photo">
                <img
                  src={supportImage}
                  alt="Family and carers supporting an older adult at home"
                  width={1200}
                  height={900}
                  loading="lazy"
                />
              </div>
              <div className="services-support__copy">
                <p className="section-kicker">
                  {support?.kicker || support?.title || ""}
                </p>
                <ul>
                  {supportItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : null}
        </div>

        {isTotalSupport && supportItems.length ? (
          <motion.div className="tsc-matrix-bleed" {...fadeUp}>
            <TscSupportMatrix
              items={supportItems}
              image={supportImage}
              kicker={support?.kicker}
              title={support?.title}
              lead={support?.lead}
            />
          </motion.div>
        ) : null}
      </section>

      {isTotalSupport ? (
        <section
          className="section tsc-areas"
          aria-labelledby="areas-heading"
        >
          <div className="section-inner tsc-areas__inner">
            <motion.div className="tsc-areas__row" {...fadeUp}>
              <div className="tsc-areas__label">
                <p className="section-kicker">{areas?.kicker || ""}</p>
                <h2 id="areas-heading">{areas?.title || ""}</h2>
              </div>
              <ul className="tsc-areas__places">
                {placesList.map((place) => (
                  <li key={place}>{place}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>
      ) : (
        <section className="section areas-section" aria-labelledby="areas-heading">
          <div className="section-inner areas-section__inner">
            <motion.div {...fadeUp}>
              <h2 id="areas-heading" className="areas-section__title">
                {areas?.title || "Areas we cover"}
              </h2>
              <p className="areas-section__copy">
                {areas?.copy || AREAS_COPY}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {!isTotalSupport ? (
        <section
          className="trust-band"
          aria-label="Care Quality Commission and trust signals"
        >
          <div className="section-inner trust-band__inner">
            <motion.aside className="trust-cqc" {...fadeUp}>
              <p className="trust-cqc__brand">Care Quality Commission</p>
              <p className="trust-cqc__lede">
                CQC registration details for{" "}
                <strong>Total Support Care</strong>
              </p>
              <p className="trust-cqc__status">
                We haven&apos;t inspected this service yet
              </p>
              <p className="trust-cqc__note">
                We checked this service was likely to be safe, effective,
                caring, responsive and well-led during registration.
              </p>
              <a
                className="trust-cqc__link"
                href={settings.cqcUrl}
                target="_blank"
                rel="noreferrer"
              >
                See registration details
              </a>
            </motion.aside>

            <motion.ul className="trust-stats" {...fadeUp}>
              <li>
                <span className="trust-stats__value">5</span>
                <span className="trust-stats__label">Years of Experience</span>
              </li>
              <li>
                <span className="trust-stats__value">5</span>
                <span
                  className="trust-stats__stars"
                  aria-label="5 out of 5 stars"
                >
                  ★★★★★
                </span>
                <span className="trust-stats__label">Client Reviews</span>
              </li>
              <li>
                <span className="trust-stats__value">98%</span>
                <span className="trust-stats__label">Positive Feedback</span>
              </li>
            </motion.ul>
          </div>
        </section>
      ) : null}

      {approachSteps.length || approach?.title ? (
        isTotalSupport ? (
          <section id="approach" className="section tsc-care">
            <div className="section-inner tsc-care__inner">
              <motion.header className="tsc-care__intro" {...fadeUp}>
                <div className="tsc-care__intro-main">
                  <p className="section-kicker">{approach?.kicker || ""}</p>
                  <h2 className="section-title">{approach?.title || ""}</h2>
                </div>
              </motion.header>

              <motion.ol className="tsc-care__rail" {...fadeUp}>
                {approachSteps.map((step) => (
                  <li key={step.title || step.word}>
                    <span className="tsc-care__dot" aria-hidden="true" />
                    {step.word ? (
                      <p className="tsc-care__word">{step.word}</p>
                    ) : null}
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                ))}
              </motion.ol>
            </div>

            {(approach?.bandTitle || approachImage) && (
              <motion.div className="tsc-care__band tsc-care__band--bleed" {...fadeUp}>
                <div className="tsc-care__band-copy">
                  <p className="tsc-care__band-kicker">
                    {approach?.bandKicker || ""}
                  </p>
                  <h3>{approach?.bandTitle || ""}</h3>
                  <p>{approach?.bandBody || ""}</p>
                </div>
                <div className="tsc-care__band-media">
                  <img
                    src={approachImage}
                    alt=""
                    width={1400}
                    height={933}
                    loading="lazy"
                  />
                </div>
              </motion.div>
            )}
          </section>
        ) : (
          <section id="approach" className="section section-teal">
            <div className="section-inner approach-layout">
              <motion.div className="approach-visual" {...fadeUp}>
                <img
                  src={approachImage}
                  alt=""
                  width={1400}
                  height={933}
                  loading="lazy"
                />
              </motion.div>
              <div>
                <motion.div {...fadeUp}>
                  <p className="section-kicker">{approach?.kicker || ""}</p>
                  <h2 className="section-title">{approach?.title || ""}</h2>
                  <p className="section-lead">{approach?.lede || ""}</p>
                </motion.div>
                <div className="approach-points">
                  {approachSteps.map((point, i) => (
                    <motion.div
                      key={point.title}
                      className="approach-point"
                      {...fadeUp}
                      transition={{
                        ...fadeUp.transition,
                        delay: reduceMotion ? 0 : 0.1 + i * 0.08,
                      }}
                    >
                      <h3>{point.title}</h3>
                      <p>{point.body}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )
      ) : null}

      {difference?.title || differenceParas.length ? (
        <section
          id="difference"
          className="section section-paper difference-section"
          aria-labelledby="difference-heading"
        >
          <div className="section-inner difference-section__inner">
            <motion.div className="difference-section__copy" {...fadeUp}>
              <h2 id="difference-heading">{difference?.title || ""}</h2>
              {differenceParas.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
              {difference?.cta?.to ? (
                <Link className="btn btn-solid" to={difference.cta.to}>
                  {difference.cta.label}
                </Link>
              ) : null}
            </motion.div>

            <motion.div className="difference-section__visual" {...fadeUp}>
              <div className="difference-section__photo">
                <img
                  src={difference?.image || DIFFERENCE_IMG}
                  alt={difference?.imageAlt || ""}
                  width={1200}
                  height={900}
                  loading="lazy"
                />
                {difference?.badge ? (
                  <span className="difference-section__badge">
                    {difference.badge}
                  </span>
                ) : null}
              </div>
              {(difference?.calloutTitle || difference?.calloutBody) && (
                <div className="difference-section__callout">
                  <h3>{difference?.calloutTitle || ""}</h3>
                  <p>{difference?.calloutBody || ""}</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      ) : null}

      <section
        id="team"
        className="section section-mist team-section"
        aria-labelledby="team-heading"
      >
        <div className="section-inner">
          {isTotalSupport && circleOrbs.length ? (
            <motion.div className="tsc-circle" {...fadeUp}>
              <div className="tsc-circle__copy">
                <p className="section-kicker">{circle?.kicker || ""}</p>
                <h2 className="section-title" id="team-heading">
                  {circle?.title || ""}
                </h2>
                <p className="section-lead">{circle?.lede || ""}</p>
              </div>

              <div className="tsc-circle__stage" aria-label={circle?.kicker || "Our circle"}>
                {circleOrbs.map((orb, i) => (
                  <article
                    key={orb.title}
                    className={`tsc-circle__orb tsc-circle__orb--${orbClass[i] || "a"}`}
                  >
                    <div
                      className={`tsc-circle__mark${
                        orb.markType === "dot"
                          ? " tsc-circle__mark--dot"
                          : orb.markType === "photo"
                            ? " tsc-circle__mark--photo"
                            : ""
                      }`}
                    >
                      {orb.markType === "dot" ? (
                        <span className="tsc-gold-dot" />
                      ) : orb.image ? (
                        <img src={orb.image} alt="" loading="lazy" />
                      ) : null}
                    </div>
                    <h3>{orb.title}</h3>
                    <p className="tsc-circle__role">{orb.role}</p>
                    <p>{orb.body}</p>
                  </article>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div className="team-section__intro" {...fadeUp}>
                <p className="section-kicker">
                  {leadership?.kicker ||
                    (isTotalSupport ? circle?.kicker : "") ||
                    "Who leads the work"}
                </p>
                <h2 className="section-title" id="team-heading">
                  {leadership?.title ||
                    (isTotalSupport ? circle?.title : "") ||
                    "Familiar leadership"}
                </h2>
                {circle?.lede && isTotalSupport ? (
                  <p className="section-lead">{circle.lede}</p>
                ) : null}
              </motion.div>

              <div className="team-grid">
                {(teamMembers.length
                  ? teamMembers
                  : isTotalSupport
                    ? []
                    : [
                        {
                          name: "Kerry Moran",
                          role: "CEO Manager",
                          photo: KERRY_PHOTO,
                          bio: "Founder-led care with a commitment that shows when families need more visits, tougher days, or simply a listening ear.",
                        },
                        {
                          name: "Nicole Pienaar",
                          role: "Team Manager",
                          photo: NICOLE_PHOTO,
                          bio: "Hands-on leadership that keeps quality consistent, matching carers thoughtfully and holding the standard of every visit.",
                        },
                      ]
                ).map((member, i) => (
                  <motion.article
                    key={member.name}
                    className="team-member"
                    {...fadeUp}
                    transition={{
                      ...fadeUp.transition,
                      delay: reduceMotion ? 0 : i * 0.12,
                    }}
                  >
                    <div className="team-photo">
                      <img
                        src={member.photo || KERRY_PHOTO}
                        alt={member.name}
                        width={300}
                        height={300}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3>{member.name}</h3>
                      <p className="team-role">{member.role}</p>
                      <p>{member.bio}</p>
                    </div>
                  </motion.article>
                ))}
              </div>

              {areas?.places ? (
                <div className="areas-band">
                  <strong>{areas?.title || "Areas we cover"}</strong>
                  <span>{areas.places}</span>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {reviewItems.length ? (
        <section id="reviews" className="section section-paper">
          <div className="section-inner reviews-section">
            <motion.div className="reviews-section__intro" {...fadeUp}>
              <p className="section-kicker">{reviewsSec?.kicker || ""}</p>
              <h2 className="section-title">{reviewsSec?.title || ""}</h2>
              <p className="section-lead">{reviewsSec?.lede || ""}</p>
            </motion.div>

            <motion.div {...fadeUp}>
              <ReviewsCarousel reviews={reviewItems} />
            </motion.div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="section section-mist">
        <div className="section-inner contact-layout">
          <motion.div {...fadeUp}>
            <p className="section-kicker">{homeContact?.kicker || ""}</p>
            <h2 className="section-title">{homeContact?.title || ""}</h2>
            <p className="section-lead">{homeContact?.lede || ""}</p>
            <div className="contact-details">
              <p>
                <a href={settings.phoneHref}>{settings.phoneDisplay}</a>
              </p>
              <p>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
              <p>{settings.addressShort}</p>
              {settings.cqcUrl || homeContact?.cqcNote ? (
                <p className="cqc-note">
                  {homeContact?.cqcNote || (
                    <>
                      CQC registered provider, see registration details on the{" "}
                      <a href={settings.cqcUrl} target="_blank" rel="noreferrer">
                        Care Quality Commission
                      </a>{" "}
                      website.
                    </>
                  )}
                </p>
              ) : null}
            </div>
          </motion.div>
          <motion.div {...fadeUp}>
            <ContactForm />
          </motion.div>
        </div>
      </section>
    </>
  );
}
