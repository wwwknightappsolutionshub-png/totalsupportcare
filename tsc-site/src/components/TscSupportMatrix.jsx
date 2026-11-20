export default function TscSupportMatrix({
  items = [],
  image,
  kicker = "",
  title = "",
  lead = "",
}) {
  return (
    <div className="tsc-matrix">
      <div className="tsc-matrix__head">
        <div>
          {kicker ? <p className="section-kicker">{kicker}</p> : null}
          {title ? <h3 className="tsc-matrix__title">{title}</h3> : null}
          {lead ? <p className="tsc-matrix__lead">{lead}</p> : null}
        </div>
        <div className="tsc-matrix__photo">
          <img
            src={image}
            alt="Family and carers supporting an older adult at home"
            width={1200}
            height={900}
            loading="lazy"
          />
        </div>
      </div>
      <ul className="tsc-matrix__grid">
        {items.map((item, i) => (
          <li key={item}>
            <span className="tsc-matrix__idx">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
