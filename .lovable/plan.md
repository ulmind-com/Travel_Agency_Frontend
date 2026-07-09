## Match reference shapes exactly using SVG clip-path (not CSS border-radius)

The current implementation uses `rounded-*` percentages which produce pill/ellipse shapes — the reference shows **asymmetric arch/leaf silhouettes** with a flat edge on one side and a full dome on the opposite side. `border-radius` cannot produce these; SVG `clipPath` with `pathData` can.

### Shape analysis from the reference

- **Left (tall)**: flat bottom, full semicircular dome top, straight vertical sides → tall arch / tombstone. Aspect ~ `3/5`.
- **Top-right**: flat left edge, rounded top + right + bottom → half-stadium leaning right (D-shape, curved side right). Aspect ~ `6/5`.
- **Bottom-right**: flat top edge, rounded left + bottom + right → inverted arch (dome on the bottom). Aspect ~ `6/5`.

All three share one design language: one straight edge, the opposite three edges form a continuous smooth curve.

### Implementation

**File: `src/components/home/plan-your-trip.tsx`**

Replace the `archShape` / `leafRightShape` / `leafRightMirrorShape` classes with three inline SVG `clipPath` definitions applied via `style={{ clipPath: 'url(#id)' }}`. Define the clip paths once at the top of the section inside a hidden `<svg>`:

```tsx
<svg width="0" height="0" className="absolute">
  <defs>
    {/* Tall arch: flat bottom, semicircular top */}
    <clipPath id="plan-arch-tall" clipPathUnits="objectBoundingBox">
      <path d="M0,0.3 A0.5,0.3 0 0,1 1,0.3 L1,1 L0,1 Z" />
    </clipPath>
    {/* D-shape opening left: flat left edge */}
    <clipPath id="plan-arch-right" clipPathUnits="objectBoundingBox">
      <path d="M0,0 L0.5,0 A0.5,0.5 0 0,1 0.5,1 L0,1 Z" />
    </clipPath>
    {/* Inverted arch: flat top, semicircular bottom */}
    <clipPath id="plan-arch-bottom" clipPathUnits="objectBoundingBox">
      <path d="M0,0 L1,0 L1,0.7 A0.5,0.3 0 0,1 0,0.7 Z" />
    </clipPath>
  </defs>
</svg>
```

Each `ShapePhoto` becomes a plain `<div>` with `aspect-*` + `style={{ clipPath: 'url(#plan-arch-tall)' }}`. Drop all `rounded-*` classes. Keep the ring/shadow via a wrapping element (shadow can't apply to a clipped element — use a `drop-shadow` filter on the parent instead of `box-shadow`).

Aspect ratios:
- Tall arch: `aspect-[3/5]`
- Top-right D: `aspect-[6/5]`
- Bottom inverted: `aspect-[6/5]`

The exact path `d` values will be tuned so the curves visually match the reference (semicircle radii adjusted so the dome portion is ~50–60% of the height for tall/inverted, and a true half-circle for the D shape).

**File: `src/routes/_authenticated.account.admin.plan-your-trip.tsx`**

Mirror the same three clip-path shapes on the admin upload thumbnails so previews match the site exactly. Add the same hidden `<svg>` block inside the admin route (or extract a tiny shared component `PlanArchClipDefs` under `src/components/home/` and import in both places — preferred, avoids duplication).

### Cleanup
- Remove the old `rounded-full` / `rounded-tl-[45%]` etc. classes.
- No data model change. No animation change. Only shape rendering swaps from `border-radius` to `clipPath`.
