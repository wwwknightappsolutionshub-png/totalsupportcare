/** Pack-aware copy for inner-page heroes when CMS fields are missing. */

export const PAGE_HERO_FALLBACKS = {
  totalsupport: {
    services: {
      title: "Everything included",
      lede: "One all-inclusive plan shaped around you, personal care, companionship, dementia support, and more, with nothing generic and nothing left out.",
    },
    about: {
      title: "About us",
      lede: "A circle is the most inclusive shape. A fingerprint is the most personal. Our care joins both.",
    },
    contact: {
      title: "Talk to us",
      lede: "Tell us what matters to you. One of our team will get in touch to see how we can help.",
    },
    opportunities: {
      title: "Join the circle",
      lede: "Care as individual as you, for the people we support, and for the people who deliver it.",
    },
    news: {
      title: "News & notes",
      lede: "Updates from the team, milestones, family guides, and the small notes that matter between visits.",
    },
  },
};

export function pageHeroFallback(packSlug, pageKey) {
  const pack =
    PAGE_HERO_FALLBACKS[packSlug] || PAGE_HERO_FALLBACKS.totalsupport;
  return (
    pack[pageKey] || PAGE_HERO_FALLBACKS.totalsupport[pageKey] || {}
  );
}
