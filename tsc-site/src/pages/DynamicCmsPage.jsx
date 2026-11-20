import { Link, useLocation } from "react-router-dom";
import { useCmsPage, useSite } from "../context/SiteContext";
import Seo from "../seo/Seo";
import { seoForPath } from "../seo/pageMeta";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
} from "../seo/jsonLd";

function Paragraphs({ items }) {
  if (!items?.length) return null;
  return items.map((p, i) => <p key={i}>{p}</p>);
}

function renderSection(section) {
  if (section.enabled === false) return null;
  const f = section.fields || {};

  switch (section.type) {
    case "home_hero":
      return (
        <header key={section.id} className="manifesto-hero cms-dyn-hero">
          {f.image ? (
            <div className="manifesto-hero__media" aria-hidden="true">
              <img src={f.image} alt="" />
              <div className="manifesto-hero__veil" />
            </div>
          ) : null}
          <div className="manifesto-hero__copy">
            {f.brand ? <p className="page-brand">{f.brand}</p> : null}
            <h1>{f.headline || "Total Support Care"}</h1>
            {f.lead ? <p className="manifesto-hero__lede">{f.lead}</p> : null}
          </div>
        </header>
      );
    case "page_hero":
      return (
        <header key={section.id} className="manifesto-hero cms-dyn-hero">
          {f.image ? (
            <div className="manifesto-hero__media" aria-hidden="true">
              <img src={f.image} alt="" />
              <div className="manifesto-hero__veil" />
            </div>
          ) : null}
          <div className="manifesto-hero__copy">
            {f.brand ? <p className="page-brand">{f.brand}</p> : null}
            <h1>{f.title || "Page"}</h1>
            {f.lede ? <p className="manifesto-hero__lede">{f.lede}</p> : null}
          </div>
        </header>
      );
    case "rich_text":
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner cms-dyn-prose">
            {f.kicker ? <p className="section-kicker">{f.kicker}</p> : null}
            {f.title ? <h2 className="section-title">{f.title}</h2> : null}
            {f.body ? <p className="section-lead">{f.body}</p> : null}
          </div>
        </section>
      );
    case "about_mission":
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner cms-dyn-prose">
            {f.title ? <h2 className="section-title">{f.title}</h2> : null}
            <Paragraphs items={f.paragraphs} />
          </div>
        </section>
      );
    case "pull_quote":
      return (
        <aside key={section.id} className="manifesto-pull">
          <blockquote>
            <p>{f.quote}</p>
          </blockquote>
        </aside>
      );
    case "principles_ledger":
      return (
        <section key={section.id} className="section section-mist">
          <div className="section-inner">
            {f.kicker ? <p className="section-kicker">{f.kicker}</p> : null}
            <h2 className="section-title">
              {[f.titleLine1, f.titleLine2].filter(Boolean).join(" ")}
            </h2>
            <ul className="cms-dyn-cards">
              {(f.items || []).map((item, i) => (
                <li key={i}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "promise":
      return (
        <section key={section.id} className="manifesto-promise">
          <p>{f.body}</p>
        </section>
      );
    case "leadership":
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner">
            {f.kicker ? <p className="section-kicker">{f.kicker}</p> : null}
            {f.title ? <h2 className="section-title">{f.title}</h2> : null}
            <ul className="cms-dyn-team">
              {(f.members || []).map((m, i) => (
                <li key={i}>
                  {m.photo ? (
                    <img src={m.photo} alt="" width={120} height={120} />
                  ) : null}
                  <div>
                    <h3>{m.name}</h3>
                    <p className="cms-dyn-role">{m.role}</p>
                    <p>{m.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "services_board":
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner">
            {f.kicker ? <p className="section-kicker">{f.kicker}</p> : null}
            {f.title ? <h2 className="section-title">{f.title}</h2> : null}
            <ul className="cms-dyn-services">
              {(f.services || []).map((s, i) => (
                <li key={i}>
                  {s.image ? (
                    <img src={s.image} alt={s.alt || ""} />
                  ) : null}
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "support_list":
      return (
        <section key={section.id} className="section section-mist">
          <div className="section-inner cms-dyn-split">
            <div>
              {f.kicker ? <p className="section-kicker">{f.kicker}</p> : null}
              {f.title ? <h2 className="section-title">{f.title}</h2> : null}
              <ul>
                {(f.items || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            {f.image ? <img src={f.image} alt="" /> : null}
          </div>
        </section>
      );
    case "areas_strip":
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner cms-dyn-prose">
            {f.copy ? <p className="section-lead">{f.copy}</p> : null}
            {f.places ? <p className="cms-dyn-places">{f.places}</p> : null}
          </div>
        </section>
      );
    case "why_cards":
      return (
        <section key={section.id} className="section section-mist">
          <div className="section-inner">
            {f.kicker ? <p className="section-kicker">{f.kicker}</p> : null}
            {f.title ? <h2 className="section-title">{f.title}</h2> : null}
            {f.lede ? <p className="section-lead">{f.lede}</p> : null}
            <ul className="cms-dyn-cards">
              {(f.items || []).map((item, i) => (
                <li key={i}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
            {f.close ? <p className="section-lead">{f.close}</p> : null}
          </div>
        </section>
      );
    case "news_masthead":
      return (
        <header key={section.id} className="section section-paper">
          <div className="section-inner cms-dyn-prose">
            {f.brand ? <p className="page-brand">{f.brand}</p> : null}
            <h1 className="section-title">{f.title || "News"}</h1>
            {f.subtitle ? <p className="section-lead">{f.subtitle}</p> : null}
          </div>
        </header>
      );
    case "news_list":
      return (
        <section key={section.id} className="section section-mist">
          <div className="section-inner">
            <ul className="cms-dyn-news">
              {(f.entries || []).map((entry, i) => (
                <li key={i}>
                  <p className="section-kicker">
                    {[entry.label, entry.tag].filter(Boolean).join(" · ")}
                  </p>
                  <h3>{entry.title}</h3>
                  <p>{entry.excerpt}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "hiring_letter":
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner cms-dyn-prose">
            <Paragraphs items={f.paragraphs} />
          </div>
        </section>
      );
    case "hiring_must":
    case "hiring_benefits":
      return (
        <section key={section.id} className="section section-mist">
          <div className="section-inner cms-dyn-split">
            <div>
              {f.title ? <h2 className="section-title">{f.title}</h2> : null}
              <ul>
                {(f.items || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            {f.image ? <img src={f.image} alt="" /> : null}
          </div>
        </section>
      );
    default:
      return (
        <section key={section.id} className="section section-paper">
          <div className="section-inner cms-dyn-prose">
            <p className="section-kicker">{section.type}</p>
            <pre className="cms-dyn-fallback">
              {JSON.stringify(f, null, 2)}
            </pre>
          </div>
        </section>
      );
  }
}

export default function DynamicCmsPage() {
  const location = useLocation();
  const path = location.pathname || "/";
  const { settings } = useSite();
  const { page, loading, error, sections } = useCmsPage(path);

  if (loading) {
    return (
      <div className="section">
        <Seo
          title="Loading… | Total Support Care"
          description="Total Support Care home care."
          path={path}
          noindex
        />
        <div className="section-inner">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="section section-paper">
        <Seo
          title="Page not found | Total Support Care"
          description="This Total Support Care page is not published or does not exist."
          path={path}
          noindex
        />
        <div className="section-inner cms-dyn-prose">
          <p className="section-kicker">Page unavailable</p>
          <h1 className="section-title">This page isn’t published yet</h1>
          <p className="section-lead">
            If you just created it in the CMS, open Site CMS, finish editing the
            blocks, then click Publish. Draft pages are not shown on the public
            site.
          </p>
          <p>
            <Link className="btn btn-solid" to="/">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const hero =
    sections.find(
      (s) =>
        s.enabled !== false &&
        (s.type === "page_hero" || s.type === "home_hero")
    )?.fields || {};
  const meta = seoForPath(path, page.title);
  const description =
    hero.lede || hero.lead || hero.subtitle || meta.description;
  const image = hero.image;

  return (
    <article className="page-cms-dynamic">
      <Seo
        title={meta.title}
        description={description}
        path={path}
        image={image}
        jsonLd={[
          organizationJsonLd(settings),
          webPageJsonLd({
            path,
            title: meta.title,
            description,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: page.title || "Page", path },
          ]),
        ]}
      />
      {sections.map((section) => renderSection(section))}
    </article>
  );
}
