import { Helmet } from "react-helmet-async";
import { absoluteAsset, absoluteUrl } from "./siteUrl";
import { useSite } from "../context/SiteContext";

const DEFAULT_OG_IMAGE = "/og-default.jpg";
const DEFAULT_DESCRIPTION =
  "Total Support Care provides all-inclusive, personalised domiciliary care across Edinburgh and Loanhead. Care as individual as you.";

/**
 * Per-page document head: title, description, canonical, robots, OG/Twitter, JSON-LD.
 */
export default function Seo({
  title,
  description,
  path = "/",
  image,
  noindex = false,
  type = "website",
  jsonLd = [],
}) {
  const { settings } = useSite();
  const siteName = settings.brandName || "Total Support Care";
  const canonical = absoluteUrl(path);
  const desc = (description || settings.tagline || DEFAULT_DESCRIPTION).trim();
  const ogImage = absoluteAsset(image || DEFAULT_OG_IMAGE);
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const graphs = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean);

  return (
    <Helmet>
      <html lang="en-GB" />
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />

      {graphs.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
