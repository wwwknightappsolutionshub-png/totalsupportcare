/**
 * Shared enterprise page header for admin / HR screens.
 */
export default function AdminPageHeader({
  eyebrow = "Total Support Care",
  title,
  description,
  meta,
  actions,
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__copy">
        {eyebrow ? <p className="admin-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-page-header__title">{title}</h1>
        {description ? (
          <p className="admin-page-header__desc">{description}</p>
        ) : null}
        {meta ? <p className="admin-page-header__meta">{meta}</p> : null}
      </div>
      {actions ? (
        <div className="admin-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
