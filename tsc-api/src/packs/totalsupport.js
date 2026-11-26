/** Total Support Care, domiciliary care pack (Edinburgh & Loanhead). */

import { seedMediaUrl } from "../services/seedMedia.js";

const LOGO = "/packs/totalsupport-icon.svg";
const LOGO_FULL = "/packs/totalsupport-logo.svg";

/** CMS image fields point at /uploads/* media library URLs (seeded into DB). */
const IMG = {
  hero: seedMediaUrl("hero"),
  about: seedMediaUrl("about"),
  services: seedMediaUrl("services"),
  community: seedMediaUrl("community"),
  dementia: seedMediaUrl("dementia"),
  elderly: seedMediaUrl("elderly"),
  eol: seedMediaUrl("eol"),
  support: seedMediaUrl("support"),
  hiring: seedMediaUrl("hiring"),
};

export const TOTALSUPPORT_PACK = {
  slug: "totalsupport",
  name: "Total Support Care",
  niche: "care",
  description:
    "All-inclusive domiciliary care, Edinburgh & Loanhead. Care as individual as you.",
  previewImage: LOGO,
  theme: {
    id: "totalsupport",
    fontDisplay: "ITC Avant Garde Gothic",
    fontBody: "Inter",
    colors: {
      primary: "#0B1F2E",
      secondary: "#14625E",
      accent: "#E3A93B",
      bg: "#F3EFE8",
      paper: "#F3EFE8",
      ink: "#0B1F2E",
      muted: "#5A6A78",
    },
    radius: "8px",
    heroStyle: "split",
    layout: "totalsupport",
  },
  settings: {
    brandName: "Total Support Care",
    logo: LOGO,
    logoFull: LOGO_FULL,
    tagline: "Care as individual as you.",
    phoneDisplay: "07522 347972",
    phoneHref: "tel:+447522347972",
    phoneAltDisplay: "",
    phoneAltHref: "",
    email: "info@totalsupportcare.co.uk",
    hrEmail: "info@totalsupportcare.co.uk",
    addressLine: "6 Dryden Rd, Loanhead, EH20 9LZ",
    addressShort: "Loanhead, EH20 9LZ · Edinburgh",
    cqcUrl: "",
    gtmContainerId: "GTM-KZFPLM2R",
    nav: [
      { label: "About", to: "/about" },
      { label: "Services", to: "/services" },
      { label: "News", to: "/news" },
      { label: "Opportunities", to: "/opportunities" },
      { label: "Contact", to: "/contact" },
    ],
    footerNav: [
      { label: "About", to: "/about" },
      { label: "Services", to: "/services" },
      { label: "News", to: "/news" },
      { label: "Contact", to: "/contact" },
      { label: "Opportunities", to: "/opportunities" },
    ],
    social: [],
  },
  pages: [
    {
      path: "/",
      title: "Home",
      sections: [
        {
          id: "home-hero",
          type: "home_hero",
          enabled: true,
          fields: {
            brand: "Total Support Care",
            headline: "Everything included. Nothing generic.",
            lead: "All-inclusive care, shaped around one person: you. Personalised domiciliary support across Edinburgh and Loanhead.",
            image: IMG.hero,
            layout: "split",
            slides: [
              { src: IMG.hero, label: "Care at home" },
              { src: IMG.community, label: "Companionship" },
              { src: IMG.elderly, label: "Elderly care" },
            ],
            primaryCta: { label: "Enquire about care", to: "/contact" },
            secondaryCta: { label: "Call us today", to: "tel:+447522347972" },
          },
        },
        {
          id: "home-services-intro",
          type: "rich_text",
          enabled: true,
          fields: {
            kicker: "Our services",
            title: "Care that stays at home with you",
            body: "Most care is sold as a list of services. We start with the person. Every plan is all-inclusive, nothing to add on, nothing left out, and written around you, with you.",
          },
        },
        {
          id: "home-services-board",
          type: "services_board",
          enabled: true,
          fields: {
            kicker: "How we support you",
            title: "Care that stays at home with you",
            services: [
              {
                title: "Domiciliary care",
                body: "Day-to-day support in your own home, preserving independence and dignity with a plan that covers what you need, without bolt-ons.",
                image: IMG.about,
                alt: "Carer supporting a client at home",
              },
              {
                title: "Community & companionship",
                body: "Stay connected. We help you keep the interests, relationships and community ties that make life yours.",
                image: IMG.community,
                alt: "Companion walking outdoors with an older adult",
              },
              {
                title: "Dementia care",
                body: "Thoughtful support for people living with dementia, familiar routines, calm presence, and reassurance for families.",
                image: IMG.dementia,
                alt: "Gentle dementia support at home",
              },
              {
                title: "Elderly care",
                body: "Support that understands ageing: comfort, enrichment, and the right help to live well at home.",
                image: IMG.elderly,
                alt: "Elderly care with a smiling carer",
              },
              {
                title: "End of life care",
                body: "Compassionate support for those choosing to spend their last days at home, with dignity for you and a steady hand for family.",
                image: IMG.eol,
                alt: "Gentle hand support during end of life care",
              },
            ],
          },
        },
        {
          id: "home-support",
          type: "support_list",
          enabled: true,
          fields: {
            kicker: "Day to day",
            title: "Services we can support in",
            lead: "One all-inclusive plan. Choose what you need, nothing bolt-on, nothing left out.",
            image: IMG.support,
            items: [
              "Personal care and hygiene",
              "Assistance with bathing, washing and toileting",
              "Dressing and grooming",
              "Support with meals and hydration",
              "Dementia care and support",
              "Mobility support",
              "Assistance with daily routines",
              "Medication support where agreed and appropriate",
              "Companionship and social support",
              "Support to maintain independence",
              "Assistance with appointments",
              "Shopping and essential errands",
              "Light household support where agreed",
              "Respite and support for family members",
              "Other care agreed as part of your plan",
            ],
          },
        },
        {
          id: "home-areas",
          type: "areas_strip",
          enabled: true,
          fields: {
            kicker: "Coverage",
            title: "Areas we cover",
            copy: "Based in Loanhead, we support people across Edinburgh and nearby communities with outstanding home care, all-inclusive, personal, and centred on you.",
            places: "Edinburgh · Loanhead · Midlothian",
            placesList: ["Edinburgh", "Loanhead", "Midlothian"],
          },
        },
        {
          id: "home-approach",
          type: "approach_steps",
          enabled: true,
          fields: {
            kicker: "How we care",
            title: "What matters to you comes first",
            lede: "",
            layout: "tsc_rail",
            steps: [
              {
                word: "Total",
                title: "Everything in one plan",
                body: "All-inclusive support with nothing bolt-on and nothing left out, written once, delivered consistently.",
              },
              {
                word: "Personal",
                title: "Shaped around your life",
                body: "History, habits and wishes sit at the centre. Familiar carers who learn the little things that matter.",
              },
              {
                word: "Together",
                title: "Families stay in the circle",
                body: "Informed, welcome and listened to, so the people who love you are never left guessing.",
              },
            ],
            bandKicker: "At every visit",
            bandTitle: "You'll know who is coming, and why they're there.",
            bandBody:
              "Continuity builds trust. Over time, carers become familiar faces, not a rotating rota.",
            image: IMG.eol,
          },
        },
        {
          id: "home-difference",
          type: "difference_block",
          enabled: true,
          fields: {
            title: "Let us make a Difference",
            paragraphs: [
              "You can have peace of mind knowing that your loved ones are cared for by a dedicated team of caring, compassionate people who are thoughtfully matched to their individual needs and personalities.",
              "They'll always know who is coming, when they're coming, and what support they'll be providing. Most importantly, they'll have a familiar, dedicated team around them.",
              "Rather than having different strangers coming and going, they'll see familiar, friendly faces who get to know them, people who, over time, become trusted friends.",
            ],
            image: IMG.community,
            imageAlt: "Companion supporting an older adult outdoors",
            badge: "5+ years of experience",
            calloutTitle: "Personalised Care Plans Tailored to You",
            calloutBody:
              "Let us create a compassionate and supportive environment for the elderly and vulnerable individuals in their own homes. Experience the difference of care that truly comes from the heart.",
            cta: { label: "Explore Our Services", to: "/services" },
          },
        },
        {
          id: "home-circle",
          type: "brand_circle",
          enabled: true,
          fields: {
            kicker: "Our circle",
            title: "People at the centre of every plan",
            lede: "Total Support Care is built around you, calm, precise support with familiar faces and families kept in the loop.",
            orbs: [
              {
                title: "Total",
                role: "Everything included",
                body: "Every need covered in one plan. All-inclusive, with no hidden extras.",
                markType: "icon",
                image: LOGO,
              },
              {
                title: "Personal",
                role: "Written around you",
                body: "A care plan shaped by your history, habits and wishes, not a generic checklist.",
                markType: "dot",
                image: "",
              },
              {
                title: "Together",
                role: "Families in the circle",
                body: "Informed, welcome, and listened to, care that includes the people who matter to you.",
                markType: "photo",
                image: IMG.community,
              },
            ],
          },
        },
        {
          id: "home-reviews",
          type: "home_reviews",
          enabled: true,
          fields: {
            kicker: "Families say",
            title: "Care that families recommend",
            lede: "Real Google reviews from people who trusted us with the people they love most.",
            items: [
              {
                name: "Family member",
                quote:
                  "Nothing was too much trouble. The team upheld their commitment through hospital and home — Dad passed peacefully in his own home as he wished.",
                source: "Family feedback",
                when: "Recent",
              },
              {
                name: "Daughter",
                quote:
                  "My Dad who has dementia used to look forward to them coming, laughing and joking while they dealt with his personal care, always putting dignity first.",
                source: "Family feedback",
                when: "Recent",
              },
              {
                name: "Relative",
                quote:
                  "Professional, respectful, caring and reliable. Communication is always a phone call away. I would recommend Total Support Care without hesitation.",
                source: "Family feedback",
                when: "Recent",
              },
            ],
          },
        },
        {
          id: "home-contact",
          type: "home_contact",
          enabled: true,
          fields: {
            kicker: "Get in touch",
            title: "Ready when your family needs us",
            lede: "Tell us a little about the support you need. We'll respond personally, no call centres, no scripts.",
            cqcNote: "",
          },
        },
      ],
    },
    {
      path: "/about",
      title: "About",
      sections: [
        {
          id: "about-hero",
          type: "page_hero",
          enabled: true,
          fields: {
            brand: "Total Support Care",
            title: "About us",
            lede: "A circle is the most inclusive shape. A fingerprint is the most personal. Our care joins both.",
            image: IMG.about,
            layout: "banner",
          },
        },
        {
          id: "about-mission",
          type: "about_mission",
          enabled: true,
          fields: {
            title: "What matters to you comes first",
            paragraphs: [
              "Total Support Care provides personalised domiciliary care from Loanhead, serving Edinburgh and the surrounding community. We believe care should feel total, every need covered in one plan, and personal, written around each person’s history, habits and wishes.",
              "Our team brings calm, precise support into your home. We encourage independence, celebrate individuality, and keep families inside the conversation. No jargon. No hidden extras. Just care as individual as you.",
              "We take pride in familiar faces and continuity. Rather than a revolving door of carers, you get a matched team who learn your routines, remember what matters, and show up with warmth and dignity.",
            ],
            layout: "stack",
          },
        },
        {
          id: "about-pull",
          type: "pull_quote",
          enabled: true,
          fields: {
            quote:
              "Care as individual as you, total support, with nothing to add on and nothing left out.",
          },
        },
        {
          id: "about-together",
          type: "principles_ledger",
          enabled: true,
          fields: {
            kicker: "Our circle",
            titleLine1: "Three ideas,",
            titleLine2: "one complete plan",
            layout: "cards",
            items: [
              {
                title: "Total",
                body: "Every need covered in one plan. All-inclusive, with no hidden extras.",
              },
              {
                title: "Personal",
                body: "A care plan written around each person’s history, habits and wishes.",
              },
              {
                title: "Together",
                body: "Families are part of the circle: informed, welcome, and listened to.",
              },
              {
                title: "Continuity you can trust",
                body: "A consistent team who know your routines, not a stream of strangers.",
              },
            ],
          },
        },
        {
          id: "about-promise",
          type: "promise",
          enabled: true,
          fields: {
            body: "Calm, precise, human. We say “you”, not “service users”. What matters to you comes first.",
          },
        },
        {
          id: "about-team",
          type: "leadership",
          enabled: true,
          fields: {
            kicker: "Leadership",
            title: "People at the centre",
            layout: "row",
            members: [
              {
                name: "Registered Manager",
                role: "Total Support Care",
                photo: IMG.about,
                bio: "Founder-led care with the person at the centre of every plan.",
              },
            ],
          },
        },
        {
          id: "about-cta",
          type: "page_cta_band",
          enabled: true,
          fields: {
            body: "Ready to talk about care for someone you love?",
            primaryCta: { label: "Get in touch", to: "/contact" },
            secondaryCta: { label: "Call us", to: "tel:+447522347972" },
            variant: "mist",
          },
        },
      ],
    },
    {
      path: "/services",
      title: "Services",
      sections: [
        {
          id: "services-hero",
          type: "page_hero",
          enabled: true,
          fields: {
            brand: "Total Support Care",
            title: "Everything included",
            lede: "One all-inclusive plan shaped around you, personal care, companionship, dementia support, and more, with nothing generic and nothing left out.",
            image: IMG.services,
            layout: "banner",
          },
        },
        {
          id: "services-board",
          type: "services_board",
          enabled: true,
          fields: {
            kicker: "How we support you",
            title: "Care that stays at home with you",
            layout: "grid",
            services: [
              {
                title: "Domiciliary care",
                body: "Day-to-day support in your own home, preserving independence and dignity with a plan that covers what you need, without bolt-ons.",
                image: IMG.about,
                alt: "Carer supporting a client at home",
              },
              {
                title: "Community & companionship",
                body: "Stay connected. We help you keep the interests, relationships and community ties that make life yours.",
                image: IMG.community,
                alt: "Companion walking outdoors with an older adult",
              },
              {
                title: "Dementia care",
                body: "Thoughtful support for people living with dementia, familiar routines, calm presence, and reassurance for families.",
                image: IMG.dementia,
                alt: "Gentle dementia support at home",
              },
              {
                title: "Elderly care",
                body: "Support that understands ageing: comfort, enrichment, and the right help to live well at home.",
                image: IMG.elderly,
                alt: "Elderly care with a smiling carer",
              },
              {
                title: "End of life care",
                body: "Compassionate support for those choosing to spend their last days at home, with dignity for you and a steady hand for family.",
                image: IMG.eol,
                alt: "Gentle hand support during end of life care",
              },
            ],
          },
        },
        {
          id: "services-support",
          type: "support_list",
          enabled: true,
          fields: {
            kicker: "In your plan",
            title: "What total support can include",
            lead: "Everything below can sit inside one all-inclusive plan, shaped around you, with nothing left as a bolt-on surprise.",
            image: IMG.support,
            layout: "split",
            items: [
              "Personal care and hygiene",
              "Assistance with bathing, washing and toileting",
              "Dressing and grooming",
              "Support with meals and hydration",
              "Dementia care and support",
              "Mobility support",
              "Assistance with daily routines",
              "Medication support where agreed and appropriate",
              "Companionship and social support",
              "Support to maintain independence",
              "Assistance with appointments",
              "Shopping and essential errands",
              "Light household support where agreed",
              "Respite and support for family members",
              "Other care agreed as part of your plan",
            ],
          },
        },
        {
          id: "services-areas",
          type: "areas_strip",
          enabled: true,
          fields: {
            kicker: "Coverage",
            title: "Areas we cover",
            copy: "Based in Loanhead, we support people across Edinburgh and nearby communities with outstanding home care, all-inclusive, personal, and centred on you.",
            places: "Edinburgh · Loanhead · Midlothian",
            placesList: ["Edinburgh", "Loanhead", "Midlothian"],
          },
        },
        {
          id: "services-why",
          type: "why_cards",
          enabled: true,
          fields: {
            kicker: "Why families choose us",
            title: "Why Total Support Care",
            lede: "We believe everyone deserves to feel safe, valued and supported at home. Our approach is calm, precise and human, because no two people need the same care.",
            close:
              "We don’t sell a menu of extras. We build one complete plan around you, and stay in the circle with your family.",
            layout: "rail",
            items: [
              {
                icon: "plan",
                title: "All-inclusive plans",
                body: "Total support in one plan, no hidden extras, nothing left out.",
              },
              {
                icon: "staff",
                title: "Matched, familiar carers",
                body: "A small team matched to your personality and preferences, not a revolving rota.",
              },
              {
                icon: "dementia",
                title: "Dementia & elderly support",
                body: "Specialist, compassionate support that keeps you comfortable in familiar surroundings.",
              },
              {
                icon: "community",
                title: "Families in the circle",
                body: "Informed, welcome, and listened to, care that includes the people who matter to you.",
              },
              {
                icon: "home",
                title: "Home first",
                body: "From daily assistance to ongoing personal care, designed so you can live well at home.",
              },
            ],
          },
        },
        {
          id: "services-cta",
          type: "page_cta_band",
          enabled: true,
          fields: {
            body: "Let us create a compassionate and supportive environment in the comfort of home.",
            primaryCta: { label: "Enquire about care", to: "/contact" },
            secondaryCta: { label: "Meet the team", to: "/about" },
            variant: "teal",
          },
        },
      ],
    },
    {
      path: "/news",
      title: "News",
      sections: [
        {
          id: "news-masthead",
          type: "news_masthead",
          enabled: true,
          fields: {
            brand: "Total Support Care",
            title: "News & notes",
            subtitle:
              "Updates from the team, milestones, family guides, and the small notes that matter between visits.",
            locality: "Edinburgh",
            metaLabel: "Field notes",
            layout: "editorial",
          },
        },
        {
          id: "news-entries",
          type: "news_list",
          enabled: true,
          fields: {
            layout: "timeline",
            entries: [
              {
                date: "2026-11-14",
                label: "14 Nov 2026",
                title: "Welcome to Total Support Care",
                excerpt:
                  "We’re building care around the person, all-inclusive plans, familiar faces, and families kept in the circle.",
                tag: "Welcome",
              },
              {
                date: "2026-10-01",
                label: "01 Oct 2026",
                title: "What “total” means in a care plan",
                excerpt:
                  "No bolt-ons. No jargon. One plan that covers what you need, written with you.",
                tag: "Guide",
              },
              {
                date: "2026-09-01",
                label: "01 Sep 2026",
                title: "Families in the circle",
                excerpt:
                  "How we keep relatives informed, welcome, and part of every important conversation.",
                tag: "Family",
              },
            ],
          },
        },
        {
          id: "news-cta",
          type: "page_cta_band",
          enabled: true,
          fields: {
            body: "Questions about dementia support or heatwave safety?",
            primaryCta: { label: "Ask the team", to: "/contact" },
            secondaryCta: { label: "See our services", to: "/services" },
            variant: "mist",
          },
        },
      ],
    },
    {
      path: "/opportunities",
      title: "Opportunities",
      sections: [
        {
          id: "jobs-hero",
          type: "page_hero",
          enabled: true,
          fields: {
            brand: "Total Support Care",
            title: "Join the circle",
            lede: "Care as individual as you, for the people we support, and for the people who deliver it.",
            image: IMG.community,
            layout: "banner",
          },
        },
        {
          id: "jobs-letter",
          type: "hiring_letter",
          enabled: true,
          fields: {
            paragraphs: [
              "At Total Support Care, everyone deserves to feel valued, respected and supported to live life on their terms.",
              "We are looking for compassionate, competent people who want to make a real difference in everyday lives.",
              "Working in care is more than a job. It is about meaningful relationships, person-centred support, and being there when someone needs you most.",
              "If you are kind, reliable and passionate about helping others, we would love to hear from you.",
            ],
          },
        },
        {
          id: "jobs-must",
          type: "hiring_must",
          enabled: true,
          fields: {
            title: "Before you apply",
            image: IMG.hiring,
            layout: "split",
            items: [
              "Full UK driving licence",
              "Your own vehicle",
              "Business insurance on your vehicle",
              "Level 2 care certificate (or willingness to attain one)",
              "Permission for an advanced DBS check",
            ],
          },
        },
        {
          id: "jobs-role",
          type: "hiring_role",
          enabled: true,
          fields: {
            label: "The role",
            title: "What a day looks like",
            paragraphs: [
              "As a care assistant at Total Support Care you will visit people in their own homes, delivering the care agreed in each personalised plan with calm, precise support.",
              "You will provide personal care, nutrition and hydration, medication support where agreed, and companionship, always centred on the person, not a generic checklist.",
              "You will be trained on each client you are matched with and will not be sent into a home without knowing what is required and what matters to that person.",
              "You will observe infection prevention protocols and complete documentation as part of our data collection and protection procedures.",
            ],
          },
        },
        {
          id: "jobs-provided",
          type: "hiring_provided",
          enabled: true,
          fields: {
            items: [
              "Training provided by Total Support Care",
              "PPE provided by Total Support Care",
              "Mileage compensation every month",
              "Weekly reflection room meetings",
              "Weekly wage at an above-average rate",
              "Company pension scheme",
              "Acknowledgement when going above and beyond",
            ],
          },
        },
        {
          id: "jobs-benefits",
          type: "hiring_benefits",
          enabled: true,
          fields: {
            title: "Benefits",
            layout: "chips",
            items: [
              "Competitive salary",
              "Pension plan",
              "28 days annual leave",
              "Free training",
              "Skill development",
            ],
          },
        },
        {
          id: "jobs-dock",
          type: "page_cta_band",
          enabled: true,
          fields: {
            body: "Come and join the circle",
            primaryCta: { label: "Email HR", to: "mailto:info@totalsupportcare.co.uk" },
            secondaryCta: { label: "General enquiry", to: "/contact" },
            variant: "teal",
          },
        },
      ],
    },
    {
      path: "/contact",
      title: "Contact",
      sections: [
        {
          id: "contact-hero",
          type: "page_hero",
          enabled: true,
          fields: {
            brand: "Total Support Care",
            title: "Talk to us",
            lede: "Tell us what matters to you. One of our team will get in touch to see how we can help.",
            image: IMG.dementia,
            layout: "banner",
          },
        },
      ],
    },
  ],
};
