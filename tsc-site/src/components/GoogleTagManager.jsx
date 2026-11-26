import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export function normalizeGtmContainerId(raw) {
  const id = String(raw ?? "").trim().toUpperCase();
  if (!id || !/^GTM-[A-Z0-9]+$/.test(id)) return "";
  return id;
}

/**
 * Injects GTM on public pages only (used from public Layout, not admin).
 */
export default function GoogleTagManager({ containerId }) {
  const location = useLocation();
  const id = normalizeGtmContainerId(containerId);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "virtual_page_view",
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    });
  }, [id, location.pathname, location.search]);

  if (!id) return null;

  const gtmInline = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;

  return (
    <>
      <Helmet>
        <script>{gtmInline}</script>
      </Helmet>
      <noscript>
        <iframe
          title="Google Tag Manager"
          src={`https://www.googletagmanager.com/ns.html?id=${id}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}