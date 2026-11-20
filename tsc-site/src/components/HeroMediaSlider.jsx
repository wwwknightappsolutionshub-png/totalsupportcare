import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function HeroMediaSlider({ slides = [], interval = 6500 }) {
  const reduceMotion = useReducedMotion();
  const list = slides.filter((s) => s?.src);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = list.length;
  const current = list[Math.min(index, Math.max(total - 1, 0))];

  useEffect(() => {
    if (total < 2 || paused || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, interval);
    return () => window.clearInterval(timer);
  }, [total, paused, reduceMotion, interval]);

  if (!current) return null;

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current.src}
          className="hero-slider__slide"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={current.src}
            alt=""
            width={2000}
            height={1333}
            fetchPriority={index === 0 ? "high" : "auto"}
          />
        </motion.div>
      </AnimatePresence>

      {total > 1 ? (
        <div className="hero-slider__dots" role="tablist" aria-label="Hero photos">
          {list.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={slide.label || `Show photo ${i + 1}`}
              className={`hero-slider__dot${i === index ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
