import { SECTION_SCHEMAS, labelForType } from "./cmsFieldSchemas";
import CmsImageField from "./CmsImageField";

function FieldControl({ field, value, onChange }) {
  if (field.kind === "textarea") {
    return (
      <textarea
        rows={field.rows || 4}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.kind === "select") {
    return (
      <select value={value ?? field.options[0]} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.kind === "object") {
    const obj = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return (
      <div className="cms-object">
        {(field.fields || []).map((sub) => (
          <label key={sub.key} className="cms-field">
            <span>{sub.label}</span>
            <FieldControl
              field={sub}
              value={obj[sub.key]}
              onChange={(v) => onChange({ ...obj, [sub.key]: v })}
            />
          </label>
        ))}
      </div>
    );
  }

  if (field.kind === "image") {
    return <CmsImageField value={value} onChange={onChange} />;
  }

  if (field.kind === "stringList") {
    const list = Array.isArray(value) ? value : [];
    return (
      <div className="cms-list">
        {list.map((item, i) => (
          <div key={i} className="cms-list__row">
            <textarea
              rows={2}
              value={item}
              onChange={(e) => {
                const next = [...list];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="cms-list__remove"
              onClick={() => onChange(list.filter((_, j) => j !== i))}
              aria-label="Remove item"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="cms-list__add" onClick={() => onChange([...list, ""])}>
          Add item
        </button>
      </div>
    );
  }

  if (field.kind === "objectList") {
    const list = Array.isArray(value) ? value : [];
    return (
      <div className="cms-object-list">
        {list.map((item, i) => (
          <div key={i} className="cms-object-list__item">
            <div className="cms-object-list__head">
              <strong>
                {field.itemLabel} {i + 1}
              </strong>
              <button
                type="button"
                className="cms-list__remove"
                onClick={() => onChange(list.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
            {field.fields.map((sub) => (
              <label key={sub.key} className="cms-field">
                <span>{sub.label}</span>
                <FieldControl
                  field={sub}
                  value={item?.[sub.key]}
                  onChange={(v) => {
                    const next = list.map((row, j) =>
                      j === i ? { ...row, [sub.key]: v } : row
                    );
                    onChange(next);
                  }}
                />
              </label>
            ))}
          </div>
        ))}
        <button
          type="button"
          className="cms-list__add"
          onClick={() => onChange([...list, { ...field.blank }])}
        >
          Add {field.itemLabel?.toLowerCase() || "item"}
        </button>
      </div>
    );
  }

  return (
    <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  );
}

function UnknownFieldsEditor({ fields, onChange }) {
  const keys = Object.keys(fields || {});
  if (!keys.length) {
    return <p className="cms-muted">No editable fields on this section.</p>;
  }
  return (
    <div className="cms-unknown">
      {keys.map((key) => {
        const val = fields[key];
        const isLong = typeof val === "string" && val.length > 80;
        const isComplex = val !== null && typeof val === "object";
        return (
          <label key={key} className="cms-field">
            <span>{key}</span>
            {isComplex ? (
              <textarea
                rows={6}
                spellCheck={false}
                value={JSON.stringify(val, null, 2)}
                onChange={(e) => {
                  try {
                    onChange({ ...fields, [key]: JSON.parse(e.target.value) });
                  } catch {
                    /* keep typing until valid */
                  }
                }}
              />
            ) : isLong ? (
              <textarea
                rows={4}
                value={String(val ?? "")}
                onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
              />
            ) : (
              <input
                type="text"
                value={String(val ?? "")}
                onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export default function CmsSectionEditor({
  section,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp = false,
  canMoveDown = false,
}) {
  const schema = SECTION_SCHEMAS[section.type];

  function patchFields(nextFields) {
    onChange({ ...section, fields: nextFields });
  }

  function setField(key, value) {
    patchFields({ ...(section.fields || {}), [key]: value });
  }

  return (
    <article className={`cms-section ${section.enabled === false ? "is-disabled" : ""}`}>
      <header className="cms-section__header">
        <div>
          <p className="cms-section__type">{labelForType(section.type)}</p>
          <h3>{section.id}</h3>
        </div>
        <div className="cms-section__tools">
          {onMoveUp || onMoveDown || onRemove ? (
            <div className="cms-section__reorder">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                aria-label="Move block up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                aria-label="Move block down"
              >
                ↓
              </button>
              <button
                type="button"
                className="cms-section__remove"
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove “${labelForType(section.type)}” from this page?`
                    )
                  ) {
                    onRemove?.();
                  }
                }}
              >
                Remove
              </button>
            </div>
          ) : null}
          <label className="cms-section__enabled">
            <input
              type="checkbox"
              checked={section.enabled !== false}
              onChange={(e) =>
                onChange({ ...section, enabled: e.target.checked })
              }
            />
            Visible on site
          </label>
        </div>
      </header>

      <div className="cms-section__body">
        {schema ? (
          schema.map((field) => (
            <label key={field.key} className="cms-field">
              <span>{field.label}</span>
              <FieldControl
                field={field}
                value={section.fields?.[field.key]}
                onChange={(v) => setField(field.key, v)}
              />
            </label>
          ))
        ) : (
          <UnknownFieldsEditor fields={section.fields} onChange={patchFields} />
        )}
      </div>
    </article>
  );
}
