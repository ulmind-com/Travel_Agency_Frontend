## Goal
Puro website ke mobile-friendly banano — frontend (public pages) + admin panel — sob kichu jate chhoto screen e (320px–480px) perfect dekhay. Kono feature/logic change hobe na, sudhu responsive layout, spacing, typography, and touch-target fixes.

## Scope

### 1. Global foundations (`src/styles.css`, `__root.tsx`)
- Confirm `<meta name="viewport">` correct (width=device-width, initial-scale=1).
- Add mobile-safe base: prevent horizontal overflow (`html, body { overflow-x: hidden }`), fluid typography clamps for `h1/h2/h3`, tap-target min 44px.
- Container padding: `px-4 sm:px-6 lg:px-10` (currently `px-6 lg:px-10` — too tight-large on small phones).

### 2. Layout shell
- **Navbar** (`components/layout/navbar.tsx`): mobile drawer already exists — audit spacing, ensure logo doesn't clip, mobile menu height/scroll, sign-in button full-width on mobile, admin link visible in mobile menu.
- **Footer** (`components/layout/footer.tsx`): stack columns, resize landscape image, readable link sizes.

### 3. Home page sections (all under `src/components/home/`)
Each section audited for: single-column stack < md, image aspect ratios, font-size clamps, padding scale, carousel/swipe support where grids exist.
- `hero.tsx` — hero height, headline clamp, CTA stack, slide controls thumb-reachable.
- `stats-row.tsx` — 2-col grid on mobile instead of 4.
- `tour-categories.tsx` — horizontal snap-scroll on mobile.
- `popular-destinations.tsx`, `popular-tours.tsx` — 1-col cards, horizontal scroll option.
- `plan-your-trip.tsx` — form stack, full-width inputs.
- `recent-gallery.tsx` — 2-col masonry on mobile.
- `achievements.tsx` — stack numbers with proper hierarchy.

### 4. Other public routes
- `packages.tsx` — filter bar collapses to bottom-sheet / accordion on mobile; card grid 1-col.
- `packages.$id.tsx` — gallery swipeable, booking panel becomes sticky bottom bar on mobile, tabs scroll horizontally.
- `destinations.$slug.tsx`, `gallery.tsx`, `blogs.tsx`, `about.tsx`, `contact.tsx` — hero + content stacking, image sizing.
- `auth.login.tsx`, `auth.register.tsx` — card full-width with padding, no split-screen on mobile.
- `book.$id.tsx`, `book.success.$bookingId.tsx` — form single column, summary card above/below.

### 5. Account + Admin panel
- `_authenticated.account.tsx` — sidebar already collapses to horizontal chip rail on mobile (recent redesign); verify chip rail scrolls, header stacks, "Live preview synced" chip hidden on mobile (already `lg:inline-flex`).
- `components/account/sidebar.tsx` — audit chip rail for overflow, add snap-scroll.
- All 7 admin routes (`_authenticated.account.admin.*.tsx`) — page headers stack, action buttons full-width on mobile, sticky action bar becomes bottom-fixed bar with safe-area padding, form fields single column, image upload zones smaller on mobile, card padding reduced (`p-4 sm:p-6 lg:p-8`), tables/lists convert to stacked cards.
- `_authenticated.account.profile.tsx`, `.bookings.tsx`, `.wishlist.tsx`, `.travelers.tsx`, `.index.tsx` — grid to 1-col, avatar/name row wrap-safe using `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0 truncate` pattern.

### 6. Reusable patterns applied everywhere
- Every header row with icon+text+widget: `grid grid-cols-[minmax(0,1fr)_auto] sm:flex` + `min-w-0` + `shrink-0` + `truncate` (per responsive-layout skill).
- Buttons: `w-full sm:w-auto` for primary CTAs in forms.
- Modals/dialogs: full-screen sheet on mobile.
- Font sizes: replace fixed `text-5xl` with `text-3xl sm:text-4xl lg:text-5xl`.
- Long horizontal grids → `overflow-x-auto snap-x` with scroll hint.

## Non-goals
- No logic, data, backend, copy, color, or feature changes.
- No new components except tiny helpers if a pattern repeats (e.g., mobile sticky action bar).
- Desktop/tablet appearance stays identical.

## Verification
- Playwright screenshots at 375×812 (iPhone), 390×844, 414×896 for: `/`, `/packages`, `/packages/:id`, `/gallery`, `/contact`, `/auth/login`, `/account`, and each of the 7 `/account/admin/*` routes.
- Check no horizontal scroll, tap targets ≥ 44px, text legible, images not cropped awkwardly.
