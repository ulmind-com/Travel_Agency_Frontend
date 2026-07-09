## Goal
Ekta notun **"Popular Destination"** section add korbo — screenshot-er a-to-z same look. Coverflow-style 3D carousel: center e ekta boro sharp card ("Himachal / 1 Listing / Details →"), duipashe blurred/smaller cards receding into depth. Cards **automatic left→right** ekta ekta kore shift korbe, admin panel theke photo + name + listing count upload/edit kora jabe.

## Placement
`src/routes/index.tsx` — `<TourCategories />`-er thik nicher e, `<FeaturedPackages />`-er age insert korbo.

## Reference match (screenshot)
- Cream background, centered heading.
- Script eyebrow: *"Top Destination"* (italic serif script, ink-teal).
- Big serif heading: **Popular Destination**.
- **Coverflow layout**: 5 cards visible; center card ~360×520 sharp/prominent, next ring (2 cards) slightly smaller + rotated inward + partially behind center, outer ring (2 cards) even smaller + blurred + further receded.
- Each card: **portrait 3:4** aspect, rounded-2xl, cover photo, gradient overlay at bottom, **destination name** (serif bold, cream), **"N Listing"** (small cream), and a **"Details →"** pill button (rounded-full, ink border, cream text with arrow) — visible only on the center card (side cards blurred so pill hidden by design).
- Auto-advance every ~3.5s, cards rotate through positions with 3D depth animation.
- Optional: click a side card → jump to that position; center card's Details → `/packages?destination=...`.

## New files
1. **`src/services/popular-destinations.service.ts`**
   - Same pattern as `tour-categories.service.ts` — localStorage CRUD, defaults bundled, `ulmind:popular-destinations-changed` event.
   - Type: `{ id, name, listingCount, imageUrl }`.
   - Defaults (7 entries so wheel has depth): Himachal, Andaman, Sundarban, Kashmir, Ladakh, Kerala, Rajasthan.
2. **`src/assets/dest-*.jpg`** (7 generated portrait 3:4 images).
3. **`src/components/home/popular-destinations.tsx`**
   - Framer Motion coverflow. State: `active` index. `useEffect` timer advances every 3500ms.
   - For each destination i, compute `offset = i - active` normalized to `[-3..3]` (shortest path around ring). Style each card by offset:
     - `offset 0`: scale 1, rotateY 0, translateX 0, z 100, blur 0, opacity 1
     - `offset ±1`: scale 0.82, rotateY ∓25°, translateX ±180px, z 60, blur 2px, opacity 0.8
     - `offset ±2`: scale 0.65, rotateY ∓35°, translateX ±320px, z 20, blur 5px, opacity 0.5
     - `|offset| ≥ 3`: opacity 0, pointer-events none
   - Container has `perspective: 1400px`, cards `position: absolute` centered, animated via `motion.div` with `animate` object driven by offset.
   - Center card renders "Details →" pill; side cards hide it via opacity gate.
   - Hover on container pauses autoplay; prev/next arrow buttons + dot pagination below.
   - Mobile (< 640px): single card view, swipe gestures (touchstart/touchend).
   - Respects `prefers-reduced-motion` (autoplay off, no rotateY).
4. **`src/routes/_authenticated.account.admin.popular-destinations.tsx`**
   - Mirror of tour-categories admin: image upload (`mediaService`), name input, listing count input, reorder up/down, remove, add new, reset, publish.

## Existing files edited
- **`src/routes/index.tsx`** — import + render `<PopularDestinations />` after `<TourCategories />`.
- **`src/lib/queries.ts`** — add `popularDestinationsQuery()`.
- **`src/services/index.ts`** — re-export new service.
- **`src/components/account/sidebar.tsx`** — add "Popular destinations" link to ADMIN_ITEMS.

## Not touched
- Backend / other sections / auth / routing shell.

## Verify
- `/` — new section renders between Tour Categories and Featured Packages. Center card is sharp with "Details →", side cards are receded + blurred, auto-cycles every 3.5s. Dot + arrows work. Hover pauses.
- `/account/admin/popular-destinations` (admin) — upload photo, edit name + listing count, save → home reflects via custom event.
- Mobile 716px — single card visible, swipe advances, dots visible.
- `prefers-reduced-motion` — autoplay off, no 3D rotate.
