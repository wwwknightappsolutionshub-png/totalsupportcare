import { useState } from "react";

export default function ServicesPanel({ services = [] }) {
  const list = Array.isArray(services) ? services : [];
  const [active, setActive] = useState(0);
  const safe = Math.min(active, Math.max(list.length - 1, 0));
  const current = list[safe];

  if (!current) return null;

  return (
    <div className="svc-board">
      <div className="svc-board__keys" role="tablist" aria-label="Care services">
        {list.map((service, i) => (
          <button
            key={service.title}
            type="button"
            role="tab"
            id={`svc-tab-${i}`}
            aria-selected={safe === i}
            aria-controls="svc-panel"
            className={`svc-board__key ${safe === i ? "is-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="svc-board__num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="svc-board__label">{service.title}</span>
          </button>
        ))}
      </div>

      <div
        className="svc-board__stage"
        role="tabpanel"
        id="svc-panel"
        aria-labelledby={`svc-tab-${safe}`}
      >
        <div className="svc-board__photo" key={current.image || current.title}>
          <img
            src={current.image}
            alt={current.alt || current.title}
            width={1200}
            height={900}
          />
        </div>
        <div className="svc-board__copy">
          <p className="svc-board__eyebrow">
            {String(safe + 1).padStart(2, "0")} /{" "}
            {String(list.length).padStart(2, "0")}
          </p>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
        </div>
      </div>
    </div>
  );
}
