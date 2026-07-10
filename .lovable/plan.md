## Goal
Make the About page hero photo panels **pixel-match the reference** — three parallel diagonal "capsule" strips (flat top edge that follows the hero's top border, rounded bottom, tilted ~65°) filled with photos. Current CSS `rotate + overflow-hidden` approach produces rectangles, not the elongated pill shape shown in the reference.

## Approach: SVG with clipPath
Replace the right-side `<div>` strips in `src/routes/about.tsx` with a single inline **SVG** that draws the exact shape and clips photos into it.

- One `<svg>` filling the right half of the hero (viewBox e.g. `0 0 600 700`, `preserveAspectRatio="xMidYMid slice"`).
- Inside `<defs>`, three `<clipPath>`s — one per strip. Each clipPath is a rotated capsule:
  - Path shape: rectangle with a semicircle on the bottom end (like `M x,0 L x+w,0 L x+w,h-r A r,r 0 0 1 x+w-r,h L x+r,h A r,r 0 0 1 x,h-r Z` where `r = w/2`).
  - Applied `transform="rotate(-25 cx cy)"` so the strip tilts while its top edge stays flush with the SVG's top edge (mimicking the reference where strips are cut off cleanly at the top by the hero container).
  - Three copies offset horizontally so they sit parallel with slight overlap, matching the reference spacing.
- Three `<image href={photoUrl} preserveAspectRatio="xMidYMid slice" clip-path="url(#stripN)" width="100%" height="100%" />` — each photo fills the SVG box but is visible only through its clipPath.
- Small dotted-grid decorations remain as they are.

## Why SVG vs CSS
The reference strip is a **capsule rotated so its flat end is clipped by the hero's top edge**. A rotated `overflow-hidden` div can't do that — the container itself rotates. SVG clipPath gives us the exact shape without rotating the photo's bounding box, and the top of the strip gets cropped naturally by the SVG viewport.

## Scope
- Only `src/routes/about.tsx`.
- Keep everything else from the last redesign (teal bg, left-side text, CTA, socials, dot grids, mobile fallback).
- Replace the `[shapeAlps, heroBg, shapeKyoto].map(...)` `<div>` block with the SVG described above.
- Mobile: keep the current 3-column rounded thumbnail fallback (SVG-clipped version only renders at `lg+`).

## Non-goals
- No changes to the collage section below, other routes, or the token file.
- No new dependencies.
