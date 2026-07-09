## Fix collage shapes + smooth photo transitions

Two small tweaks to `src/components/home/plan-your-trip.tsx` only. No other files, no data changes.

### 1. Shape fix — all three slots are the same "stadium/arch" shape
Reference shows the left big shape AND both right shapes as identical rounded pill/arch forms (fully rounded top + bottom, straight-ish sides), just at different sizes and aspect ratios. Currently the two right slots are perfect circles — that's wrong.

- All three slots: use the arch shape (`rounded-[50%]` on all corners, i.e. a stadium/pill that scales with aspect ratio).
- Aspect ratios matching the reference:
  - Left arch: `aspect-[3/5]` (tall portrait) — already correct.
  - Top-right arch: `aspect-[5/6]` (near-square, slightly taller).
  - Bottom-right arch: `aspect-[5/6]` (same).
- Remove the `shape: "arch" | "circle"` prop and the `rounded-full` branch — everything is one shape now.
- Admin `SlotEditor` / `PhotoCell` previews also drop the circle branch so admin thumbnails match the homepage.

### 2. Smoother auto-rotate transition
The current `rotateY: 90° → 0°` full-flip feels abrupt and briefly shows a blank edge. Replace with a gentler crossfade:

- `AnimatePresence mode="wait"` (not `popLayout`) so the outgoing image finishes before the next mounts — no overlap flash.
- Motion: `opacity 0 → 1`, `scale 1.04 → 1`, `rotateY 8° → 0°` (very subtle depth cue, no full flip).
- Duration `1.4s`, ease `[0.22, 1, 0.36, 1]`.
- Interval stays `4600ms`; stagger stays `0 / 1200 / 2400ms`; hover-pause + reduced-motion behavior unchanged.
- Keep `perspective: 1200px` on the slot so the subtle rotateY still reads as 3D.

### Not touched
Copy, features, admin data model, service, query, sidebar, layout grid, background disc.
