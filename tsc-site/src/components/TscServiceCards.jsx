import { useState } from "react";
import { Link } from "react-router-dom";

export default function TscServiceCards({ services = [] }) {
  const [active, setActive] = useState(0);
  const safe = Math.min(active, Math.max(services.length - 1, 0));
  const current = services[safe];
  if (!current) return null;

  return (
    <div className="tsc-svc">
      <div className="tsc-svc__rail" role="tablist" aria-label="Care services">
        {services.map((service, i) => (
          <button
            key={service.title}
            type="button"
            role="tab"
            id={`tsc-svc-tab-${i}`}
            aria-selected={safe === i}
            aria-controls="tsc-svc-panel"
            className={`tsc-svc__chip${safe === i ? " is-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="tsc-svc__num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{service.title}</span>
          </button>
        ))}
      </div>

      <div
        className="tsc-svc__stage"
        role="tabpanel"
        id="tsc-svc-panel"
        aria-labelledby={`tsc-svc-tab-${safe}`}
      >
        <div className="tsc-svc__media" key={current.image}>
          <img
            src={current.image}
            alt={current.alt || current.title}
            width={1200}
            height={900}
          />
        </div>
        <div className="tsc-svc__copy">
          <p className="tsc-svc__eyebrow">In your plan</p>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <Link className="tsc-svc__link" to="/services">
            View all services
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
