import { useSite } from "../context/SiteContext";

function digitsFromHref(href) {
  const digits = String(href || "").replace(/\D/g, "");
  return digits || "447307702284";
}

export default function WhatsAppWidget({ className = "" }) {
  const { settings, pack } = useSite();
  const brand = settings.brandName || pack?.name || "Total Support Care";
  const phone = digitsFromHref(settings.phoneHref);
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hello ${brand}, I’d like to enquire about care support.`
  )}`;

  return (
    <a
      className={`wa-nav-icon ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.37 4 14.96c0 2.1.55 4.14 1.6 5.95L4 29l8.3-1.72a12.1 12.1 0 0 0 3.74.58h.01C22.68 27.86 28 22.49 28 15.9 28 9.3 22.68 3 16.04 3zm7.05 17.08c-.3.84-1.74 1.55-2.43 1.65-.62.09-1.4.13-2.26-.14-.52-.16-1.19-.39-2.05-.76-3.61-1.56-5.95-5.2-6.13-5.44-.18-.24-1.47-1.95-1.47-3.72s.93-2.64 1.26-3c.33-.36.72-.45.96-.45h.7c.22 0 .52-.08.81.62.3.72 1.02 2.49 1.11 2.67.09.18.15.39.03.63-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.36.37-.15.72.21.36.93 1.53 2 2.48 1.37 1.22 2.53 1.6 2.89 1.78.36.18.57.15.78-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.33.12 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.87-.21 1.71z" />
      </svg>
    </a>
  );
}
