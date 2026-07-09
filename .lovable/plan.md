## "Plan Your Trip With Us" section — premium editorial + admin-managed

Add a new home section modeled on the reference: a left-side artistic image collage (tall arch + two circles) paired with a right-side content block (eyebrow, headline, description, two feature bullets with icons, CTA button). Photos rotate through admin-uploaded sets with a subtle 3D animation. Everything ultra-premium, matching the site's cream/ink serif style (not the reference's blue/white palette).

### Scope
Homepage only. Placed right after the Popular Destinations section in `src/routes/index.tsx`.

### Visual composition
```text
┌───────────────────────┬──────────────────────────────┐
│  ╭─────╮   ╭──────╮   │  Let's Go Together  (script) │
│  │ ARCH│   │CIRCLE│   │  Plan Your Trip              │
│  │ tall│   │  top │   │  With Us            (serif)  │
│  │     │   ╰──────╯   │                              │
│  │     │              │  Body paragraph…             │
│  │     │   ╭──────╮   │                              │
│  │     │   │CIRCLE│   │  ◆ Exclusive Trip  (feature) │
│  │     │   │ btm  │   │  ◆ Professional Guide        │
│  ╰─────╯   ╰──────╯   │                              │
│                       │  [ Learn More → ]            │
└───────────────────────┴──────────────────────────────┘
```
- Left collage: 3 image slots — `tall arch` (rounded-top, left), `circle-top`, `circle-bottom` (right column, stacked). Soft cream disc drifting behind for depth.
- Right column: script eyebrow (font-serif italic, ink), large serif headline, muted body copy, two feature rows (icon-in-rounded-square + title + description), dark pill CTA linking to `/packages`.
- Colors reuse existing `cream-*` / `ink-*` tokens — no hard-coded hex. No purple/blue.

### 3D auto-rotate animation
Each of the 3 image slots holds an ordered list of photos. On an interval (~4.2s, staggered by slot so they don't flip in unison), the visible photo swaps with a Framer Motion 3D flip:
- Outgoing image: `rotateY 0 → -90°`, `opacity 1 → 0`, slight `z` push.
- Incoming image: `rotateY 90° → 0°`, `opacity 0 → 1`.
- `perspective: 1200px` on each slot; `transformStyle: preserve-3d`.
- Pauses on hover of the collage; respects `prefers-reduced-motion` (cross-fade only).
- If a slot only has 1 image, it stays static (no flip).

### Data & admin
New service `src/services/plan-your-trip.service.ts` (localStorage, same pattern as `popular-destinations.service.ts`) storing:
```ts
type PlanYourTripContent = {
  eyebrow: string;           // "Let's Go Together"
  title: string;             // "Plan Your Trip With Us"
  description: string;
  ctaLabel: string;          // "Learn More"
  ctaHref: string;           // "/packages"
  features: { id; title; description }[];  // 2 items default
  slots: {
    arch:    { id; imageUrl }[];   // rotating photos
    circleA: { id; imageUrl }[];
    circleB: { id; imageUrl }[];
  };
};
```
- Emits `ulmind:plan-your-trip-changed` for live sync.
- Defaults ship with 2-3 curated images per slot (generated: hills/mountain, ghats/river, taj-style monument — reusing existing dest images where sensible, plus 2-3 new generated ones if needed).
- Query added to `src/lib/queries.ts` as `planYourTripQuery()`. Service exported from `src/services/index.ts`.

Admin route `src/routes/_authenticated.account.admin.plan-your-trip.tsx` mirroring existing admin pages:
- Text inputs for eyebrow / title / description / CTA label / CTA href.
- Feature editor: title + description per feature (add/remove/reorder, keep 2 minimum).
- Per-slot photo manager: upload via `mediaService`, reorder, remove, add. Same UI patterns already used in popular-destinations admin.
- Publish + reset-to-defaults buttons.
- Sidebar link "Plan your trip" added to `src/components/account/sidebar.tsx`.

### Component
`src/components/home/plan-your-trip.tsx`:
- Suspense-reads `planYourTripQuery()`, subscribes to change event.
- Renders collage + copy in a `Container`, 2-col grid on `lg`, stacked on mobile (collage first).
- Uses `FadeUp` for entry, Framer Motion for per-slot flipping.
- Feature icons: `lucide-react` (`Compass` for Exclusive Trip, `UserRound` for Professional Guide) in a rounded ink-tinted square — swappable via admin only through text for now (icon set fixed to keep design consistent).

### Files touched
- **New**: `src/services/plan-your-trip.service.ts`, `src/components/home/plan-your-trip.tsx`, `src/routes/_authenticated.account.admin.plan-your-trip.tsx`, 3-6 new `src/assets/plan-*.jpg` defaults.
- **Edited**: `src/routes/index.tsx` (mount section), `src/lib/queries.ts` (query), `src/services/index.ts` (export), `src/components/account/sidebar.tsx` (nav link).
- **Untouched**: everything else (Popular Destinations, Tour Categories, backend, auth).
