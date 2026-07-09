## Achievements Stats section (homepage)

Build a new premium "Achievements" homepage section that matches the reference A→Z: four large outlined circles arranged along a curvy dotted path, each showing a big number + label, with animated blue orbiting dots. Fully admin-editable.

### Visual layout (match reference exactly)

- Full-width band, cream background
- SVG curved path (soft wavy line) that weaves through all 4 circles — 1st circle low, 2nd high, 3rd low, 4th high (zig-zag on the curve)
- 4 large circles:
  - Big serif number (e.g. `12`, `97%`, `8k`, `19k`)
  - Small label underneath (`Years Experience`, `Retention Rate`, `Tour Completed`, `Happy Travellers`)
  - Very soft pale-blue fill, thin blue ring border, `rounded-full`, ~260–320px
  - Each has one small blue dot sitting on its perimeter (the "orbit dot")
- Decorative accents (inline SVG / doodle assets, low opacity, non-editable):
  - Top-left small car doodle
  - Bottom-left palm trees + hot-air balloon cluster
  - Bottom-right circular arrow-up accent

### Animations (ultra premium)

- On scroll-in: circles fade + scale up (0.9 → 1) staggered 120ms, numbers count-up from 0 to final value over ~1.4s (`framer-motion` `animate` on a motion value, easing `[0.22,1,0.36,1]`)
- Idle: the blue perimeter dot slowly orbits its circle (continuous 8s linear rotation)
- **Hover on a circle**:
  - Orbit dot speeds up (8s → 1.6s rotation) and pulses/blinks (opacity 1 → 0.4 → 1, 0.9s loop)
  - Dot gets a soft glowing halo (blue shadow, scales 1 → 1.4)
  - Circle border brightens, subtle lift shadow
- SVG path draws in on mount (`pathLength` 0 → 1 over 1.6s)
- Respect `prefers-reduced-motion` (skip orbit + count-up)

### Admin panel

New route `/account/admin/achievements` (under `_authenticated`, admin-gated like other admin pages):
- Edit eyebrow (optional) + section title (optional, hidden if empty to match reference which has no header)
- Manage exactly **4 fixed stat slots**, each with:
  - Value (string, e.g. `97%`, `19k`)
  - Label (string)
- Publish button → persists via `achievementsService`
- Sidebar link added in `src/components/account/sidebar.tsx`

### Data & wiring

- New `src/services/achievements.service.ts` — localStorage-backed (same pattern as `popular-tours.service.ts` / `recent-gallery.service.ts`), with `defaultAchievements` containing the 4 reference stats
- Register `achievementsQuery` in `src/lib/queries.ts`
- Export from `src/services/index.ts`
- New component `src/components/home/achievements.tsx` (framer-motion for orbit + count-up)
- Mount in `src/routes/index.tsx` right after `<RecentGallery />`
- Replace nothing — this is additive (existing `StatsRow` stays or can be removed later per user)

### Files to create

- `src/components/home/achievements.tsx`
- `src/services/achievements.service.ts`
- `src/routes/_authenticated.account.admin.achievements.tsx`

### Files to edit

- `src/routes/index.tsx` — inject `<Achievements />`
- `src/services/index.ts` — export service
- `src/lib/queries.ts` — add `achievementsQuery`
- `src/components/account/sidebar.tsx` — add admin link

### Quality bar

- Uses existing tokens (`ink-900`, `cream-50`) + one soft blue accent variable
- Curved SVG path matches reference zig-zag
- Buttery orbit + count-up, reduced-motion safe
- Admin flow mirrors existing admin pages
