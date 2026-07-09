## Recent Gallery section (homepage)

Build a new premium "Recent Gallery" homepage section that matches the reference screenshot A→Z, with entrance animations and full admin control.

### Visual layout (match reference exactly)

- Centered header:
  - Script italic eyebrow: *"Make Your Tour More Pleasure"* (font-serif italic, ink/70)
  - Big bold sans title: **"Recent Gallery"** (dark teal, `font-serif` heavy, ~5xl–7xl)
- Asymmetric collage grid with **5 image tiles** in the exact reference arrangement:

```text
 ┌───────┐            ┌───────┐
 │  1    │  ┌─────┐   │  3    │
 │ tall  │  │  2  │   │ tall  │
 │ left  │  │ mid │   │ right │
 └───────┘  │offset│  └───────┘
 ┌───────┐  │ down │   ┌───────┐
 │  4    │  └─────┘   │  5    │
 │ tall  │            │ tall  │
 └───────┘            └───────┘
```

  - Columns 1 & 3: two stacked square-ish tiles
  - Column 2 (center): single tile, vertically centered / offset downward so it sits between the two rows
  - All tiles: `rounded-3xl`, soft shadow, subtle ring, `object-cover`
  - Two small decorative side accents ("gallery image" plane/car doodles) matching the reference — inline SVG, low opacity, positioned left-middle and bottom-left; a small circular arrow-up accent bottom-right

### Animations (ultra premium)

- Each tile fades + slides in one-by-one on scroll (IntersectionObserver / Framer Motion `whileInView`), staggered ~120ms in reference order (1 → 2 → 3 → 4 → 5)
- Entrance: `opacity 0 → 1`, `y: 40 → 0`, subtle `scale 0.94 → 1`, easing `[0.22,1,0.36,1]`, duration 900ms
- Hover: gentle `scale(1.03)` on image, shadow lift, 700ms cubic-bezier
- Respect `prefers-reduced-motion`

### Admin panel

New route `/account/admin/recent-gallery` (under `_authenticated`, admin-gated like the other admin pages):
- Edit eyebrow, title
- Manage exactly **5 fixed slots** (slot 1–5, each mapped to a position in the collage). Admin can upload/replace/remove the image per slot via `mediaService.upload`
- Save button → persists via `recentGalleryService`
- Sidebar link added in `src/components/account/sidebar.tsx`

### Data & wiring

- New `src/services/recent-gallery.service.ts` — localStorage-backed (same pattern as `popular-tours.service.ts` / `plan-your-trip.service.ts`), with `defaultRecentGallery` (eyebrow, title, `slots: { id, imageUrl, alt }[]` length 5)
- Register `recentGalleryQuery` in `src/lib/queries.ts`
- Export from `src/services/index.ts`
- New component `src/components/home/recent-gallery.tsx` using Framer Motion `FadeUp`-style stagger
- Mount in `src/routes/index.tsx` right after the Popular Tours section
- Register admin route in file-based routing (auto-picked up by TanStack plugin)

### Files to create

- `src/components/home/recent-gallery.tsx`
- `src/services/recent-gallery.service.ts`
- `src/routes/_authenticated.account.admin.recent-gallery.tsx`

### Files to edit

- `src/routes/index.tsx` — inject `<RecentGallery />`
- `src/services/index.ts` — export service
- `src/lib/queries.ts` — add `recentGalleryQuery`
- `src/components/account/sidebar.tsx` — add admin link

### Quality bar

- Colors from existing tokens (`ink-900`, `cream-50`) — no hardcoded hex
- Matches reference typography (script italic eyebrow + bold serif title)
- Collage tile positions & aspect ratios match the reference visually
- Smooth staggered entrance, buttery hover, reduced-motion safe
- Admin flow mirrors existing admin pages for consistency
