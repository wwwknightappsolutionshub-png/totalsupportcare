import { SECTION_LABELS, SECTION_SCHEMAS } from "./cmsFieldSchemas";

/** Block types suitable for new / custom pages (home_hero is home-only). */
export const ADDABLE_BLOCK_TYPES = Object.keys(SECTION_SCHEMAS).filter(
  (t) => t !== "home_hero"
);

const BLANK_FIELDS = {
  page_hero: {
    brand: "Total Support Care",
    title: "New page",
    lede: "Add your introduction here.",
    image: "/uploads/seed-svc-domiciliary.jpg",
  },
  rich_text: {
    kicker: "Overview",
    title: "Section title",
    body: "Edit this section with your page content.",
  },
  about_mission: {
    title: "Our mission",
    paragraphs: ["Add a paragraph about your mission."],
  },
  pull_quote: { quote: "Add a short quote here." },
  principles_ledger: {
    kicker: "Principles",
    titleLine1: "How we",
    titleLine2: "work together",
    items: [{ title: "Principle", body: "Describe this principle." }],
  },
  promise: { body: "Our promise to families." },
  leadership: {
    kicker: "Team",
    title: "Leadership",
    members: [
      { name: "Name", role: "Role", photo: "", bio: "Short bio." },
    ],
  },
  services_board: {
    kicker: "Services",
    title: "What we offer",
    services: [
      {
        title: "Service",
        body: "Describe this service.",
        image: "/uploads/seed-svc-domiciliary.jpg",
        alt: "",
      },
    ],
  },
  support_list: {
    kicker: "Support",
    title: "How we support you",
    lead: "One all-inclusive plan, nothing bolt-on, nothing left out.",
    image: "/uploads/seed-svc-support.jpg",
    items: ["Support item one", "Support item two"],
  },
  areas_strip: {
    kicker: "Coverage",
    title: "Areas we cover",
    copy: "We support families across our local area.",
    places: "Edinburgh · Loanhead · Midlothian",
    placesList: ["Edinburgh", "Loanhead", "Midlothian"],
  },
  why_cards: {
    kicker: "Why us",
    title: "Why families choose Total Support Care",
    lede: "A short introduction.",
    close: "We’re here when you need us.",
    items: [
      { icon: "plan", title: "Card title", body: "Card body." },
    ],
  },
  news_masthead: {
    brand: "Total Support Care",
    title: "News",
    subtitle: "Updates from Total Support Care.",
    locality: "Edinburgh",
    metaLabel: "Field notes",
  },
  news_list: {
    entries: [
      {
        date: new Date().toISOString().slice(0, 10),
        label: "Today",
        tag: "Update",
        title: "News title",
        excerpt: "Short excerpt.",
      },
    ],
  },
  hiring_letter: {
    paragraphs: ["Write to candidates here."],
  },
  hiring_must: {
    title: "What you’ll need",
    image: "/uploads/seed-hiring-interview.jpg",
    items: ["Requirement one"],
  },
  hiring_benefits: {
    title: "Benefits",
    items: ["Benefit one"],
  },
  hiring_role: {
    label: "The role",
    title: "What a day looks like",
    paragraphs: ["Describe a typical day."],
  },
  hiring_provided: {
    items: ["Training provided", "PPE provided"],
  },
  approach_steps: {
    kicker: "How we care",
    title: "What matters to you comes first",
    lede: "",
    layout: "tsc_rail",
    steps: [
      {
        word: "Total",
        title: "Everything in one plan",
        body: "All-inclusive support with nothing bolt-on.",
      },
    ],
    bandKicker: "At every visit",
    bandTitle: "You'll know who is coming",
    bandBody: "Continuity builds trust.",
    image: "/uploads/seed-svc-eol.jpg",
  },
  brand_circle: {
    kicker: "Our circle",
    title: "People at the centre of every plan",
    lede: "Calm, precise support with familiar faces.",
    orbs: [
      {
        title: "Total",
        role: "Everything included",
        body: "Every need covered in one plan.",
        markType: "icon",
        image: "/packs/totalsupport-icon.svg",
      },
    ],
  },
  difference_block: {
    title: "Let us make a Difference",
    paragraphs: ["Add a paragraph."],
    image: "/uploads/seed-svc-community.jpg",
    imageAlt: "",
    badge: "5+ years of experience",
    calloutTitle: "Personalised Care Plans",
    calloutBody: "Care that comes from the heart.",
    cta: { label: "Explore Our Services", to: "/services" },
  },
  home_reviews: {
    kicker: "Families say",
    title: "Care that families recommend",
    lede: "Real Google reviews from people who trusted us.",
    items: [
      {
        name: "Reviewer",
        quote: "Add a review quote.",
        source: "Google Review",
        when: "Recently",
      },
    ],
  },
  home_contact: {
    kicker: "Get in touch",
    title: "Ready when your family needs us",
    lede: "Tell us a little about the support you need.",
    cqcNote: "",
  },
  page_cta_band: {
    body: "Ready to talk?",
    primaryCta: { label: "Contact us", to: "/contact" },
    secondaryCta: { label: "Our services", to: "/services" },
    variant: "teal",
  },
  home_hero: {
    brand: "Total Support Care",
    headline: "Headline",
    layout: "split",
    slides: [],
    primaryCta: { label: "Enquire about care", to: "/contact" },
    secondaryCta: { label: "Call us today", to: "tel:" },
    lead: "Lead text.",
    image:
      "/uploads/seed-hero.jpg",
  },
  pack_hero: {
    style: "page",
    eyebrow: "Section",
    title: "Page title",
    lede: "Supporting line.",
    image: "",
    primaryCta: { label: "Get a Quote", to: "/contact" },
    secondaryCta: { label: "", to: "" },
    badges: [],
  },
  pack_service_strip: {
    label: "Service categories",
    linkTo: "/services",
    cards: [
      {
        kind: "label",
        title: "Residential",
        icon: "home",
        tone: "mint",
        to: "/services",
      },
    ],
  },
  pack_about_stats: {
    layout: "stacked",
    kicker: "About",
    title: "About title",
    body: "About body.",
    image: "",
    insetImage: "",
    stats: [{ value: "100+", label: "Clients" }],
  },
  pack_services_grid: {
    layout: "showcase",
    kicker: "Services",
    title: "Our services",
    lede: "",
    linkTo: "/services",
    cta: { label: "Get a Free Quote", to: "/contact" },
    services: [
      {
        num: "01",
        title: "Service",
        body: "Description",
        image: "",
        icon: "home",
        to: "/services",
      },
    ],
  },
  pack_service_detail: {
    intro: "Service introduction.",
    includedTitle: "What’s Included",
    included: ["Item one"],
    howTitle: "How We Work",
    howBody: "Describe the process.",
    overviewTitle: "Service Overview",
    overview: [
      { icon: "tag", label: "Starting price", value: "From $99" },
      { icon: "clock", label: "Typical duration", value: "2, 4 hours" },
      { icon: "users", label: "Ideal for", value: "Homes & offices" },
    ],
    cta: { label: "Get a Free Quote", to: "/contact" },
    note: "Free, no-obligation quote.",
  },
  pack_why: {
    layout: "panel",
    kicker: "Why Choose Us",
    title: "Why us",
    body: "Short body.",
    image: "",
    cta: { label: "Book a Cleaning", to: "/contact" },
    features: [{ title: "Trusted team", icon: "shield" }],
  },
  pack_process_steps: {
    layout: "showcase",
    kicker: "How It Works",
    title: "Three simple steps",
    featuredIndex: "1",
    steps: [
      {
        num: "01",
        icon: "cursor",
        title: "Book Online",
        body: "Pick a time that suits you.",
      },
    ],
  },
  pack_cta_banner: {
    eyebrow: "Next step",
    title: "Ready to get started?",
    body: "Book a visit today.",
    image: "",
    cta: { label: "Book Now", to: "/contact" },
  },
  pack_rating_strip: {
    image: "",
    rating: "4.9 +",
    ratingLabel: "Average Rating",
    satisfaction: "98% Customer Satisfaction",
    ctaTitle: "Get a Quote for Free",
    ctaBody: "No hidden fees, no surprises.",
    title: "New York's *Top-Rated*\nMoving Company",
    body: "Experience a seamless and stress-free move with our renowned service.",
    cta: { label: "Get a Quote", to: "/contact" },
    stats: [
      { value: "100%", label: "Client Satisfaction" },
      { value: "35+", label: "Years of experience" },
      { value: "230+", label: "Client Feedback" },
      { value: "120+", label: "Team Member" },
    ],
  },
  pack_pricing: {
    layout: "showcase",
    kicker: "Pricing",
    title: "Simple plans",
    linkTo: "/contact",
    tiers: [
      {
        name: "Essential",
        blurb: "For regular upkeep",
        price: "$89",
        unit: "/ visit",
        badge: "",
        cta: "Choose Plan",
        to: "/contact",
        features: ["Feature one"],
      },
    ],
  },
  pack_testimonials: {
    layout: "showcase",
    kicker: "Testimonials",
    title: "Loved by clients",
    rating: "4.9",
    ratingNote: "Average rating",
    items: [
      {
        quote: "Wonderful service.",
        name: "Alex",
        role: "Homeowner",
        photo: "",
      },
    ],
  },
  pack_faq: {
    layout: "showcase",
    kicker: "FAQ",
    title: "Common questions",
    asideTitle: "Still have questions?",
    asideBody: "We’re happy to help.",
    asideCta: { label: "Contact Us", to: "/contact" },
    items: [{ q: "Question?", a: "Answer." }],
  },
  pack_blog_teaser: {
    layout: "showcase",
    kicker: "From the Blog",
    title: "Latest articles",
    linkTo: "/blog",
    cta: { label: "View All Articles", to: "/blog" },
    posts: [
      {
        tag: "Tips",
        read: "4 min read",
        title: "Article title",
        excerpt: "Short excerpt…",
        image: "",
        to: "/blog",
      },
    ],
  },
  pack_blog_detail: {
    layout: "shiftly",
    date: "Feb 9, 2026",
    title: "Article title",
    tag: "Moving",
    image: "",
    sections: [
      {
        title: "Section heading",
        body: "Section body…",
        bullets: [],
      },
    ],
    prevTo: "",
    prevLabel: "",
    nextTo: "",
    nextLabel: "",
  },
  pack_contact: {
    title: "Get in touch",
    body: "Send a message.",
    phone: "",
    email: "",
    submitLabel: "Send message",
  },
  pack_chip_marquee: { items: ["Item one", "Item two"] },
  pack_service_tags: {
    kicker: "Services",
    title: "What we offer",
    lede: "",
    cta: { label: "Contact", to: "/contact" },
    services: [{ title: "Service", body: "", image: "", tags: [] }],
  },
};

export function blockTypeOptions() {
  return ADDABLE_BLOCK_TYPES.map((type) => ({
    type,
    label: SECTION_LABELS[type] || type,
  }));
}

export function createBlankSection(type, title = "New page") {
  const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
  const fields = structuredClone(BLANK_FIELDS[type] || {});
  if (type === "page_hero") {
    fields.title = title;
  }
  if (type === "rich_text" && title) {
    fields.title = title;
  }
  return {
    id,
    type,
    enabled: true,
    fields,
  };
}

export function cloneSections(sections, title) {
  return (sections || []).map((section, index) => {
    const next = structuredClone(section);
    next.id = `${section.type || "block"}-${Math.random().toString(36).slice(2, 9)}`;
    if (index === 0 && next.type === "page_hero" && title) {
      next.fields = { ...(next.fields || {}), title };
    }
    if (index === 0 && next.type === "home_hero" && title) {
      next.fields = { ...(next.fields || {}), headline: title };
    }
    return next;
  });
}

export function sectionsFromBlockTypes(types, title) {
  const list = types.length ? types : ["page_hero", "rich_text"];
  return list.map((type) => createBlankSection(type, title));
}
