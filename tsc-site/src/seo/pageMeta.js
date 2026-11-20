/** Unique title + description per public route (TSC-only). */

export const TSC_PAGE_SEO = {
  "/": {
    title: "All-inclusive home care in Edinburgh & Loanhead | Total Support Care",
    description:
      "Total Support Care provides all-inclusive, personalised domiciliary care across Edinburgh and Loanhead. Care as individual as you.",
  },
  "/about": {
    title: "About Total Support Care | Care as individual as you",
    description:
      "A circle is the most inclusive shape. Meet Total Support Care, all-inclusive domiciliary support from Loanhead, serving Edinburgh.",
  },
  "/services": {
    title: "Domiciliary, dementia & companionship care | Total Support Care",
    description:
      "Everything included: personal care, companionship, dementia support and more, one plan shaped around you across Edinburgh and Loanhead.",
  },
  "/news": {
    title: "News & notes | Total Support Care",
    description:
      "Updates from Total Support Care, milestones, family guides, and the small notes that matter between visits.",
  },
  "/opportunities": {
    title: "Care assistant jobs in Edinburgh | Total Support Care careers",
    description:
      "Join Total Support Care. Compassionate care roles with training, support and meaningful work across Edinburgh and Loanhead.",
  },
  "/contact": {
    title: "Contact Total Support Care | Enquire about home care",
    description:
      "Talk to Total Support Care about all-inclusive home care in Edinburgh and Loanhead. A real person will reply.",
  },
};

export function pageSeoForPack(path, _packSlug) {
  const clean =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path || "/";
  const key = clean === "" ? "/" : clean;
  return TSC_PAGE_SEO[key] || null;
}

export function seoForPath(path, fallbackTitle, _packSlug = "totalsupport") {
  const known = pageSeoForPack(path, "totalsupport");
  if (known) return known;
  const brand = "Total Support Care";
  const locality = "Edinburgh and Loanhead";
  const title = fallbackTitle ? `${fallbackTitle} | ${brand}` : brand;
  return {
    title,
    description: `${brand} provides personalised home care across ${locality}.`,
  };
}
