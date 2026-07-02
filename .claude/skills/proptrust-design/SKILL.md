---
name: proptrust-design
description: Design language, copy rules, and hard fences for any UI work in the PropTrust repo. Read before writing or editing UI.
---

# PropTrust design skill

Read this before writing or editing ANY UI in this repo.

## Design language (derived from the live app)

**Important:** `tailwind.config.ts` defines a `brand.*` color palette
(`brand-blue`, `brand-navy`, etc.) and `globals.css` defines matching
`--pt-*` CSS variables — but neither is actually used anywhere in
`src/` (checked: zero `bg-brand-*`/`text-brand-*` classes in the
codebase). The real convention is raw hex arbitrary-value classes.
Match what's actually there, not the unused config.

- **Colour tokens** (same hex values as the unused `brand.*`/`--pt-*`
  definitions, but applied as Tailwind arbitrary values — e.g.
  `text-[#0f172a]`, `bg-[#1e40af]`):
  - `#0f172a` (navy) — primary headings, dark surfaces/sections, primary buttons on light backgrounds. Most-used brand color (179 occurrences).
  - `#1e40af` (blue) — primary CTAs, links, section eyebrows/labels, icons. Second most-used (149 occurrences).
  - `#3b82f6` (blue-lt) — lighter accent, used sparingly (hero CTA on dark backgrounds).
  - `#f8fafc` (bg) — light section backgrounds alternating with white (marketing pages stripe light/white sections).
  - `#dc2626` / `#16a34a` / `#d97706` (red/green/amber) — rare direct use; for status, prefer Tailwind's built-in `red-*`/`green-*`/`amber-*` (see badges below).
  - Tailwind's built-in `slate-*` scale carries everything else: `slate-50` page background, `slate-100`/`slate-200` borders and dividers, `slate-400`/`500` muted/meta text, `slate-600`/`700` body copy, `slate-900` headings on white.
  - Canonical files: `src/app/page.tsx` (marketing), `src/app/tenant/(app)/dashboard/page.tsx` (app).

- **Type scale** (actual sizes/weights in use, not a formal scale):
  - Hero H1: `text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight`
  - Section H2: `text-3xl md:text-4xl font-extrabold tracking-tight`
  - Page/dashboard H1: `text-2xl font-bold`
  - Card/list title: `text-base font-semibold` (or `font-bold` for emphasis)
  - Price / primary numeric value: largest, boldest element in its card — `text-2xl` to `text-[28px] font-extrabold leading-none tracking-tight` (see property card, Phase D redesign)
  - Section eyebrow/label: `text-xs font-bold uppercase tracking-widest` (marketing) or `text-xs font-medium uppercase tracking-wider` (dashboard section headers)
  - Body copy: `text-sm`/`text-base leading-relaxed text-slate-500` or `text-slate-600`
  - Meta/micro text: `text-xs text-slate-400`

- **Spacing rhythm:**
  - Card padding: `p-5` (dashboard/app cards), `p-6`–`p-8` (marketing feature cards)
  - Grid/flex gaps: `gap-4` (dashboard), `gap-5`/`gap-6` (marketing card grids), `gap-2`/`gap-3` (inline buttons)
  - Vertical stacks: `space-y-3` to `space-y-6` depending on density
  - Section spacing (marketing): `py-14`–`py-28` between full-width sections
  - Dashboard sections separated by `mb-6`/`mb-8`

- **Radius, border, shadow conventions:**
  - `rounded-xl` — default card/input/button radius (see `.card` utility below)
  - `rounded-2xl` — larger feature cards, property cards, CTA panels
  - `rounded-full` — pills, badges, avatar circles, primary marketing CTAs
  - Default card border: `border border-slate-200` (app), or `ring-1 ring-slate-100` (marketing cards use ring instead of border)
  - `shadow-sm` at rest, `hover:shadow-md` on interactive/clickable cards

- **Component patterns** — reference the canonical file for each:
  - **Card**: `.card` utility in `src/app/globals.css` (`rounded-xl border border-slate-200 bg-white shadow-sm`). Canonical usage: `src/app/tenant/(app)/dashboard/page.tsx`.
  - **Badge / status pill**: `bg-{color}-100 text-{color}-700 rounded-full px-2.5 py-1 text-xs font-semibold`. Canonical: `VERIFICATION_BADGE` / `APP_STATUS` / `INTRO_STATUS` maps in `src/app/tenant/(app)/dashboard/page.tsx`.
  - **Stat card**: `StatCard` helper in `src/app/tenant/(app)/dashboard/page.tsx` — `.card p-5` + uppercase tracking-wider label + `text-2xl font-bold` value.
  - **Property card**: `PropertyCard` in `src/app/browse/BrowseListing.tsx` — photo, score badge, verified badge, then title → location → price (strongest) → recommendation → CTA, in that order (redesigned in the pre-launch card-polish pass).
  - **CTA button**: primary = `rounded-full` (marketing) or `rounded-lg`/`rounded-xl` (app), filled with `bg-[#0f172a]`, `bg-[#1e40af]`, or `bg-blue-700`, `font-bold`/`font-semibold text-white`. Secondary/outline = `border-2 border-white/25` on dark backgrounds, `border border-slate-200` on light.
  - **Toggle**: `DiscoverableToggle` in `src/app/tenant/(app)/dashboard/DiscoverableToggle.tsx` — not a switch input; a pill button that swaps color/label between two states (`bg-green-100 text-green-700` active vs `bg-slate-100 text-slate-500` paused), with optimistic update + rollback on failure.

## Palette rules

Theme: "trust plus evolution". Neutral and trustworthy, not
loud or trendy.

- Warm off-white surfaces, deep navy for headings/dark
  sections, blue as the only accent color.
- No gradients anywhere in PropTrust UI.
- No green in PropTrust UI. Green is reserved exclusively
  for use inside the chat prop (the scene narrative artifact);
  it must never appear in real product surfaces, badges, or
  marketing sections.
- This supersedes the `green-*` status-badge/toggle usage
  documented above as current-state fact; new work must not
  extend it, and existing green UI is a known deviation to be
  cleaned up, not a pattern to copy.

## Hierarchy rules

- Property cards: price > title > location > recommendation.
- Dashboards lead with action, never zero-value stats.
- One primary CTA per screen.

## Copy rules

- Public brand is PropTrust, never propflow.
- No em dashes or en dashes anywhere in copy or UI text.
  Rewrite as separate sentences or use a colon instead.
- Banned words: seamless, unlock, empower, leverage, simply,
  revolutionise, game-changer.
- Trust claims: only "POPIA aligned approach", "private
  document storage", "tenant-controlled sharing",
  "encrypted at rest". Nothing stronger.
- Tenant-facing language: fit, readiness, profile strength,
  area match, application confidence. Never risk/yield/
  cap-rate in tenant surfaces.

## Motion rules

- Animate transform and opacity ONLY. Never width/height/
  top/left (layout thrash; low-end Android matters in SA).
- 150–300ms, ease-out. State changes and entrances only —
  no ambient or looping decoration.
- Wrap all motion in prefers-reduced-motion checks.
- CSS transitions are the default primitive. Do not add
  framer-motion/motion or any animation dependency without
  explicit approval in the prompt.

## External components (21st.dev etc.)

- Reference implementations only. Read for structure and
  interaction pattern, then REBUILD in PropTrust tokens.
- Never paste a component wholesale. Never inherit its
  colour/spacing opinions. Check licence per component.
- Never add a dependency a template asks for without
  explicit approval.

## Hard fences (always, regardless of prompt)

- Never touch profiles.is_connector or the connector
  routing in MarketingNav.tsx.
- Never create/modify migrations from a UI task.
- Mobile-first: 44px minimum touch targets.
