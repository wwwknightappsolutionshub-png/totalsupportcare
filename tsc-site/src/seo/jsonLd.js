import { SITE_URL, absoluteUrl, absoluteAsset } from "./siteUrl";

const DEFAULT_PHONE = "07522 347972";
const DEFAULT_EMAIL = "info@totalsupportcare.co.uk";
const DEFAULT_LOGO = "/packs/totalsupport-icon.svg";

function phoneE164(display = DEFAULT_PHONE) {
  const digits = String(display).replace(/\D/g, "");
  if (digits.startsWith("44")) return `+${digits}`;
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  return `+${digits}`;
}

/** Organization + LocalBusiness (HomeHealthCare), matches visible NAP. */
export function organizationJsonLd(settings = {}) {
  const name = settings.brandName || "Total Support Care";
  const phone = phoneE164(settings.phoneDisplay || DEFAULT_PHONE);
  const email = settings.email || DEFAULT_EMAIL;
  const logo = settings.logo || DEFAULT_LOGO;

  return {
    "@context": "https://schema.org",
    "@type": ["HomeHealthCare", "LocalBusiness", "Organization"],
    "@id": `${SITE_URL}/#organization`,
    name,
    url: SITE_URL,
    logo: absoluteUrl(logo),
    image: absoluteAsset("/og-default.jpg"),
    email,
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine || "6 Dryden Rd",
      addressLocality: "Loanhead",
      postalCode: "EH20 9LZ",
      addressRegion: "Edinburgh",
      addressCountry: "GB",
    },
    areaServed: [
      { "@type": "City", name: "Edinburgh" },
      { "@type": "City", name: "Loanhead" },
    ],
    description:
      "All-inclusive, personalised domiciliary care across Edinburgh and Loanhead. Care as individual as you.",
    slogan: settings.tagline || "Care as individual as you.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "customer service",
        areaServed: "GB",
        availableLanguage: ["English"],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Total Support Care",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-GB",
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": absoluteUrl("/contact"),
    url: absoluteUrl("/contact"),
    name: "Contact Total Support Care",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
}

export function webPageJsonLd({ path, title, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absoluteUrl(path),
    url: absoluteUrl(path),
    name: title,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
}
