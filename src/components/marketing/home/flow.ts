// ── Split gate flow control ────────────────────────────────────────────────
// Plain DOM helpers (no React state, no context) so any client component
// anywhere in the tree — the gate buttons, the switch links — can choose a
// side the same way HomeReveal.tsx drives its own [data-reveal] system.
// Browser-only: only ever called from an event handler, never during render.

export type Flow = "tenant" | "landlord";

const SCROLL_TARGET: Record<Flow, string> = {
  tenant: "#the-old-way",
  landlord: "#convergence",
};

export function chooseFlow(flow: Flow) {
  const html = document.documentElement;
  html.classList.add("gate-js");
  html.setAttribute("data-flow", flow);

  const target = document.querySelector(SCROLL_TARGET[flow]);
  if (!target) return;

  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}
