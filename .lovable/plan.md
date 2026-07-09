## Popular Destinations — small tweaks only

Scope: `src/components/home/popular-destinations.tsx` only. No other files, no logic/data changes.

### Changes
1. **Remove dot pagination** — delete the row of dot buttons under the coverflow.
2. **Keep prev/next arrows, make them clickable navigation** — already clickable; verify `onClick` calls `go(-1)` / `go(1)` and that pointer-events aren't blocked. Slightly enlarge the arrow buttons (e.g. from `h-10 w-10` → `h-12 w-12`, icon `h-4` → `h-5`) so they're easier to tap.
3. **Enlarge the cards** — bump the center card + neighbors proportionally:
   - Card base size: mobile ~`w-64 h-80` → `w-72 h-96`; desktop ~`w-72 h-96` → `w-80 h-[28rem]` (roughly +15%).
   - Increase side-card `translateX` offsets to match (e.g. ±180 → ±210, ±320 → ±370) so spacing still looks balanced.
   - Container `min-h` bumped accordingly.

### Not touched
- Auto-advance timing, 3D tilt/blur math, swipe, reduced-motion, data source, admin panel, everything else on the page.
