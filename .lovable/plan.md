## Goal
Make the navbar invisible over the hero (as today), and once the user scrolls past the hero, morph it into a floating, rounded **liquid‑glass pill** that stays visible on the cream sections below.

## Behavior
- At the very top (over hero): navbar stays exactly as it is now — transparent, cream text, full width.
- After scrolling ~80px down: navbar animates into a **centered, rounded pill** that floats near the top of the viewport.
  - Shrinks in width (max-w ~5xl), gets `rounded-full`, subtle margin from the top.
  - Liquid glass surface: `bg-ink-900/40` + `backdrop-blur-2xl` + `saturate-150`, hairline `border border-cream-50/15`, soft shadow, inner top-edge highlight.
  - Text stays cream/light so it reads on both dark blur and cream page.
  - Smooth transition (opacity, transform, border-radius, width) with `cubic-bezier(0.22,1,0.36,1)` over ~500ms.
- Scrolling back up to the hero: reverses smoothly to the transparent full-width state.

## Implementation (single file)
`src/components/layout/navbar.tsx`
- Add a `scrolled` state driven by a `scroll` listener (threshold 80px, passive).
- Header wrapper: switch between two class sets based on `scrolled`:
  - Not scrolled: current `fixed inset-x-0 top-0 bg-transparent`.
  - Scrolled: `fixed top-3 left-1/2 -translate-x-1/2 w-[min(1120px,calc(100%-24px))] rounded-full border border-cream-50/15 bg-ink-900/40 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]` plus a subtle inner top highlight via a pseudo overlay.
- Inner row: reduce height slightly when scrolled (`h-14 lg:h-16`) and tighten horizontal padding (`px-6 lg:px-8`).
- Keep all existing links, dropdown, auth actions, and mobile menu untouched — only the shell changes.
- Ensure the Destinations mega‑dropdown still anchors correctly under the trigger inside the pill (it already uses absolute positioning; unaffected).
- Mobile: keep current behavior; the pill styling only applies at md+ (mobile keeps a simple full-width translucent bar when scrolled).

## Non-goals
- No changes to hero, routes, or any other component.
- No new dependencies.
