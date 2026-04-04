# Tap In — Styling Guide

This document describes the visual language implemented in the app so new screens, games, and integrations stay consistent. It is derived from `src/app/globals.css`, shared UI components, layout shell, and primary flows (home, party lobby, menu).

## `stitch-design.html` (Google AI / Stitch)

**This file is not in the repository.** If you have a `stitch-design.html` export elsewhere, add it under `docs/` (or link it in a PR) so tokens and layout rules can be cross-checked. Until then, **the source of truth for shipped UI is this codebase**, especially:

- CSS variables in `src/app/globals.css`
- `src/lib/fonts.ts` and `src/app/layout.tsx`
- `src/components/ui/*`, `src/components/layout/AppShell.tsx`, `src/components/brand/TapInWordmark.tsx`

When Stitch HTML is available, align on: primary/secondary accents, border weight, shadow offset, and whether headings stay **uppercase + headline font** as in the live app.

---

## Design pillars

1. **Warm light surfaces** — Off-white background (`#fcf9f8`), dark text (`#1c1b1b`), not pure black-on-white.
2. **Neo-brutalist / chunky UI** — Heavy borders (`border-4` / `border-8` where emphasis is needed), **hard offset shadows** (no soft Gaussian blur for primary chrome).
3. **Controlled playfulness** — Asymmetric “wobbly” radii, slight rotations on headings (`rotate-1`, `-rotate-1`), Memphis-style background textures at **very low opacity** so they do not compete with content.
4. **Material-style palette roles** — Primary / secondary / tertiary / surface “containers” map to CSS variables; use tokens instead of one-off hex except for **game-specific** accents (see Game cards).

---

## Color system

Defined on `:root` in `globals.css` and exposed to Tailwind via `@theme inline`.

| Role | CSS variable | Typical use |
|------|----------------|-------------|
| Background | `--background` | Page background |
| Foreground | `--foreground` | Body text, strong borders |
| Primary | `--primary` (#bb0058) | Brand emphasis, wordmark, primary buttons, links accent |
| Primary dark / darker | `--primary-dark`, `--primary-darker` | Shadows referencing brand depth |
| Primary container | `--primary-container` | Soft pink tints |
| Secondary | `--secondary` (#006970) | Teal accent, focus ring on inputs, wordmark shadow, QR frame shadow |
| Secondary container | `--secondary-container` | Bright cyan-green highlights |
| Tertiary | `--tertiary` | Olive accent; menu FAB, status chips |
| Tertiary container | `--tertiary-container` | Lime chip backgrounds |
| Surface ladder | `--surface` … `--surface-container-highest` | Cards, panels, borders subtlety |
| Outline | `--outline`, `--outline-variant` | Muted text, placeholders |
| Error | `--error`, `--error-container` | Validation |

**Tailwind usage:** Prefer semantic names: `bg-surface`, `text-foreground`, `border-foreground`, `bg-primary`, `text-secondary`, `bg-tertiary-container`, etc., as mapped in `@theme inline`.

**Viewport / PWA chrome:** `themeColor` in `layout.tsx` matches the background (`#fcf9f8`).

---

## Typography

| Role | Font (next/font) | CSS variable | Application |
|------|------------------|--------------|-------------|
| Headline | Space Grotesk | `--font-headline` | `font-headline` — titles, buttons, logo, big numeric codes |
| Body | Plus Jakarta Sans | `--font-body` | `font-body` — paragraphs, descriptions |
| Label | Spline Sans | `--font-label` | `font-label` — small caps labels, badges, meta |

**Conventions:**

- Marketing and game titles: **uppercase**, `font-headline`, `font-bold`, often `tracking-tighter` or `tracking-tight`.
- Section labels / badges: **uppercase**, small size (`text-xs` / `text-[10px]`), wide tracking (`tracking-widest` / `tracking-[0.2em]`), `font-label` or `font-headline` depending on emphasis.
- Body copy: `font-body`, `text-outline` for secondary text.

**Wordmark:** `TapInWordmark` uses italic uppercase headline, `text-primary`, and a **teal hard shadow**: `drop-shadow-[4px_4px_0px_#006970]` — replicate this pairing (primary + teal shadow) for hero treatments that should feel “on brand.”

---

## Layout & spacing

- **Page shell:** Content sits above a fixed Memphis background from `AppShell` (dots + squiggles, very low opacity). Foreground pages use `relative z-10` where needed.
- **Max width:** Home and menu content often `max-w-md` / `max-w-sm` for readable single-column layouts on phones.
- **Safe areas:** Menu header/footer use `env(safe-area-inset-*)` for notched devices.
- **Vertical rhythm:** Common gaps: `gap-3`, `gap-4`, `gap-6`, `space-y-6`; section separation with rules or `mt-12` + divider pattern (see home page “or join an existing party”).

---

## Borders and radii

- **Standard chunky border:** `border-4 border-foreground` for inputs, buttons, key cards. Thicker `border-8` for prominent panels (e.g. QR card outer frame).
- **Wobbly corners:** Utility classes in `globals.css`: `wobbly-br-1`, `wobbly-br-2`, `wobbly-br-3` — asymmetric radii. Buttons use these by size; reuse instead of arbitrary `rounded-*` when matching the UI kit.
- **Inputs** use a mixed corner pattern: `rounded-tl-lg rounded-br-lg rounded-tr-[24px] rounded-bl-[24px]` (not the wobbly utilities) — a distinct “pill + corner” look.
- **Select** inverts the corner pairing vs input (see `Select.tsx`) for visual variety while staying on the same system.

---

## Shadows and depth

The UI uses **solid offset shadows** (brutalist), not soft multi-layer blur:

- Buttons: `shadow-[6px_6px_0px_0px_#3f0019]` (primary) or `shadow-[4px_4px_0px_0px_#006970]` (secondary), etc.
- Cards / modals: `shadow-[8px_8px_0px_0px_…]` or `12px_12px` for hero panels; menu join card uses `shadow-[12px_12px_0px_0px_#bb0058]`.
- Subtle list rows: sometimes `boxShadow` with **alpha** on the shadow color (e.g. `${shadowColor}20`) for lighter elevation.

**Interaction:** Hover often `hover:-translate-y-0.5`; active press `active:translate-y-1 active:translate-x-1 active:shadow-none` (buttons) to simulate physical push. Keep durations short: `duration-150`, `transition-all`.

---

## Components (canonical patterns)

### Buttons (`Button.tsx`)

- Variants: **primary** (magenta fill, dark shadow), **secondary** (white/surface + teal shadow), **ghost** (surface hover only).
- Always `font-headline font-bold uppercase tracking-wider`.
- Disabled: reduced opacity, no press translation; shadow preserved where specified.

### Inputs / Selects

- `border-4 border-foreground`, `bg-surface-lowest`.
- Focus: border shifts to **secondary** (input) or **tertiary** (select), slight lift, matching color shadow.
- Errors: `border-error` + red offset shadow; message `font-label font-bold text-error`.

### Toasts (`AppShell` + Sonner)

- Light surface, `border-2`, small brutalist shadow; title uses headline uppercase; description uses outline color.

### Menu FAB

- Circular, `bg-tertiary-container`, `border-4`, `shadow-[4px_4px_0px_0px_#1c1b1b]`, playful `hover:rotate-2 hover:scale-110`.

---

## Decorative backgrounds (Memphis)

Classes in `globals.css`:

- `memphis-dots` — radial dots using primary color; shell uses **~3%** opacity.
- `memphis-squiggles` — SVG squiggle stroke in secondary teal; **~2%** opacity.
- `memphis-diag` — diagonal grid + dots; used on fullscreen menu at full bleed with `backdrop-blur-md`.

New pages: either rely on the global shell dots/squiggles only, or add another layer at **low opacity** so readability stays high.

---

## Game-specific UI

The **game picker** assigns per-game palettes (`GamePicker.tsx`): e.g. dark card + lime border (Blitzkrieg), pink card (Quip Pro Quo), tertiary-container (Fib or Fable). Default fallback uses `secondary` and shared shadow/border rules.

**When adding a game:** Prefer a small palette object keyed by `game.id` that sets `bg`, `text`, `border`, `shadow`, `badge`, and `wobbly-*` class — keeps cards consistent in structure but distinct in personality.

Player list / avatars use a **rotating palette** of approved background + border pairs and staggered shadow colors — avoid introducing random hex outside the established sets unless updating the guide.

---

## Motion

- **Product UI:** Short, purposeful transitions (150ms). Micro-rotations on hover for menu button; scale/translate for press.
- **Game-specific keyframes** live in `globals.css` (e.g. Blitzkrieg, Quip Pro Quo). Prefix new game animations clearly (e.g. `qpq-*`) and avoid reusing names across games.

---

## Accessibility & touch

- `tap-highlight-color` removed globally (`*` rule).
- Focus visible: game cards use `focus-visible:ring-4 focus-visible:ring-primary/40`.
- Prefer real `<button>` / labels with `htmlFor` as in existing inputs.

---

## Checklist for new UI

1. Use **semantic colors** from `@theme` / CSS variables before arbitrary hex.
2. Use **headline / body / label** fonts for their roles; uppercase pattern for titles and chrome.
3. Prefer **border-4** + **offset shadow** for interactive surfaces.
4. Reuse **Button**, **Input**, **Select** before inventing new primitives.
5. Keep Memphis overlays **subtle**; content stays on `bg-surface` / `bg-surface-lowest` cards.
6. Match **z-index** expectations: shell decorations `z-0`, main content `z-10`, menu `z-50` / `z-100` as in `AppMenu`.

---

## File index

| Area | Files |
|------|--------|
| Tokens & theme | `src/app/globals.css` |
| Fonts | `src/lib/fonts.ts`, `src/app/layout.tsx` |
| Shell & toasts | `src/components/layout/AppShell.tsx` |
| Menu | `src/components/layout/AppMenu.tsx` |
| Brand | `src/components/brand/TapInWordmark.tsx` |
| Primitives | `src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx` |
| Party / home | `src/app/page.tsx`, `src/components/party/*` |

---

*Last aligned with the repository at authoring time. If `stitch-design.html` is added, append a short “Stitch parity” section with any deltas.*
