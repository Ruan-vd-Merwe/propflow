"use client";

import { useEffect } from "react";

/**
 * Progressive-enhancement scroll reveal for the homepage.
 *
 * Default HTML/CSS state (no JS, or prefers-reduced-motion) is fully
 * visible and in its final position — see the base rules in globals.css.
 * On mount, this adds a `.js` class to <html>, which is the ONLY thing
 * that switches [data-reveal] elements into their hidden pre-animation
 * state. An IntersectionObserver then adds `.in-view` to each
 * [data-reveal] element once, the first time it crosses ~35% visible.
 *
 * Renders nothing.
 */
export function HomeReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    document.documentElement.classList.add("js");

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  return null;
}
