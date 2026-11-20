import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function GoogleMark() {
  return (
    <svg
      className="reviews-carousel__google"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Stars() {
  return (
    <div className="reviews-carousel__stars" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsCarousel({ reviews = [] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = reviews.length;
  const current = reviews[index];

  useEffect(() => {
    if (!total || paused || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [total, paused, reduceMotion]);

  if (!current) return null;

  const go = (next) => {
    setIndex((prev) => (prev + next + total) % total);
  };

  return (
    <div
      className="reviews-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="reviews-carousel__viewport">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={current.name}
            className="reviews-carousel__card"
            initial={reduceMotion ? false : { opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -28 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="reviews-carousel__top">
              <div className="reviews-carousel__person">
                <span className="reviews-carousel__avatar" aria-hidden="true">
                  {initials(current.name)}
                </span>
                <div>
                  <strong>{current.name}</strong>
                  <span className="reviews-carousel__meta">
                    <GoogleMark />
                    {current.source || "Google Review"}
                    {current.when ? ` · ${current.when}` : ""}
                  </span>
                </div>
              </div>
              <Stars />
            </div>

            <blockquote>&ldquo;{current.quote}&rdquo;</blockquote>
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="reviews-carousel__controls">
        <button
          type="button"
          className="reviews-carousel__nav"
          onClick={() => go(-1)}
          aria-label="Previous review"
        >
          ←
        </button>
        <div className="reviews-carousel__dots" role="tablist" aria-label="Reviews">
          {reviews.map((review, i) => (
            <button
              key={review.name}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show review from ${review.name}`}
              className={`reviews-carousel__dot${i === index ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="reviews-carousel__nav"
          onClick={() => go(1)}
          aria-label="Next review"
        >
          →
        </button>
      </div>

      <div className="reviews-carousel__rail" aria-hidden="true">
        {reviews.map((review, i) => (
          <button
            key={review.name}
            type="button"
            className={`reviews-carousel__thumb${i === index ? " is-active" : ""}`}
            onClick={() => setIndex(i)}
            tabIndex={-1}
          >
            <span className="reviews-carousel__avatar reviews-carousel__avatar--sm">
              {initials(review.name)}
            </span>
            <span>
              <strong>{review.name}</strong>
              <Stars />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
