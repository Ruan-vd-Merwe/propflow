"use client";

import { useEffect, useRef } from "react";

/**
 * Progressive-enhancement scroll reveal.
 *
 * The wrapped markup is fully visible and in its final position by default
 * (see .reveal / .reveal-mess base rules in globals.css) — that is the
 * server-rendered, no-JS state. On mount, this component opts the section
 * INTO the animated treatment by adding `.js-animate`, then uses an
 * IntersectionObserver to add `.in-view` to each `.reveal`/`.reveal-mess`
 * descendant as it enters the viewport, once, on entrance only.
 *
 * If prefers-reduced-motion is set, `.js-animate` is never added, so
 * everything renders in its final state with no transition at all.
 */
export function ScrollReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.classList.add("js-animate");

    const targets = el.querySelectorAll<HTMLElement>(".reveal, .reveal-mess");
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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    targets.forEach((target, i) => {
      target.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
