## Goal
Stats row-er ("14 / 24/7 / 100% / 08") thik nicher e ekta notun **"Tour Categories"** section add korbo — screenshot-er "Wornderful Place For You / Tour Categories" section-er a-to-z same look. Cards ekta ekta kore **automatic left → right** slide korbe with a **3D tilt animation** (screenshot-er moto slightly rotated cards). Admin panel theke ei category cards-er photo + name upload/edit kora jabe.

## Reference match (screenshot)
- Cream/off-white background, centered heading.
- Script eyebrow: *"Wornderful Place For You"* (italic serif script).
- Big serif heading: **Tour Categories**.
- 5 cards visible at once, rounded-3xl, subtle drop shadow, **prominent 3D tilt** — cards alternate rotation (~-6°, +4°, -3°, +5°, -4°) with slight Y offset so it feels like a fanned deck.
- Below each card: **Category name** (serif, ink color) + small *"See More"* link.
- Bottom: dot pagination (5 dots, active = filled ink).
- Auto-advance left-to-right; pauses on hover; swipe on mobile.

## Placement
`src/routes/index.tsx` — insert `<TourCategories />` right after `<StatsRow />`, before `<FeaturedPackages />`. `CollectionsScroll` remains (different intent — horizontal scroll of destinations).

## New files
1. **`src/services/tour-categories.service.ts`**
   - Same pattern as `hero-slides.service.ts` — localStorage-backed CRUD with bundled defaults, `ulmind:tour-categories-changed` event for live sync.
   - Type: `{ id, name, imageUrl, category: PackageCategory }`.
   - Defaults (matches screenshot spirit): Sea Beach, Pilgrimage, Wildlife, Hill Stations, Heritage, Adventure, Honeymoon (7 total so carousel has room to loop).
2. **`src/assets/tour-cat-*.jpg`** (7 generated images: sea-beach, pilgrimage, wildlife, hill-stations, heritage, adventure, honeymoon) — used as fallback defaults.
3. **`src/components/home/tour-categories.tsx`**
   - Framer Motion carousel. Uses `motion.div` with continuous `x` translation via `animate` loop (marquee-style), OR index-based auto-advance every ~3.5s with `AnimatePresence` sliding cards left. Chosen: **index-based auto-advance** so dot pagination stays in sync and matches screenshot's dots.
   - Renders a window of 5 cards (responsive: 2 on mobile, 3 on tablet, 5 on desktop).
   - Each card has a **3D tilt**: `rotate` based on its position in the visible window (`[-6, 4, -3, 5, -4]`) + `translateY` offset, plus `perspective(1200px)` on the container so tilt feels dimensional.
   - Hover: card lifts (`translateY(-8px)`) and straightens (`rotate: 0`) with 500ms ease.
   - `useEffect` timer advances index every 3500ms; pauses on `onMouseEnter`, resumes on leave; respects `prefers-reduced-motion`.
   - Dot pagination at bottom, click to jump.
   - Clicking a card navigates to `/packages?category={category}` (typed `Link`).
4. **`src/lib/queries.ts`** — add `tourCategoriesQuery()` mirroring `heroSlidesQuery()`.
5. **`src/routes/_authenticated.account.admin.tour-categories.tsx`**
   - Same shape as `_authenticated.account.admin.hero.tsx`. Admin-gated via `isAdmin`.
   - List of categories with: image preview, name input, category dropdown (PackageCategory enum), upload button (uses existing `mediaService.upload`), remove, reorder (up/down), add new, reset to defaults, save.

## Existing files edited
- **`src/routes/index.tsx`** — import + render `<TourCategories />` after `<StatsRow />`.
- **`src/components/account/sidebar.tsx`** — add "Tour Categories" link under the existing admin section (next to "Hero Slides").
- **`src/services/index.ts`** — re-export `tourCategoriesService`.

## Not touched
- Backend / API — no `/tour-categories` endpoint exists; localStorage persistence mirrors hero-slides approach (admin edits persist per-browser; media uploads still go through real `/media/upload`).
- Nav, footer, other home sections, auth, routing shell.

## Verify
- `/` — scroll past stats; new section renders with 5 tilted cards, auto-advances every ~3.5s left→right, dots update, hover pauses + straightens card.
- Playwright screenshots at t=0 and t=4s to confirm visible slide change + tilt.
- `/account/admin/tour-categories` (as admin) — upload replaces image, save persists, home reflects change on next visit (custom event triggers re-render).
- `prefers-reduced-motion` — autoplay disabled, tilt reduced.
- Mobile (716px) — 2 cards visible, swipe works, dots still shown.
