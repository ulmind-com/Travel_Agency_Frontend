## Match reference shapes exactly + one static photo per slot

Scope: `src/components/home/plan-your-trip.tsx`, `src/services/plan-your-trip.service.ts`, `src/routes/_authenticated.account.admin.plan-your-trip.tsx`. Nothing else.

### 1. Shapes — match reference precisely (asymmetric arches, not ellipses)
The reference shows three distinct arch silhouettes, not identical stadiums:

- **Left (tall)**: symmetric tall stadium — rounded semicircle top + semicircle bottom, straight vertical sides.
  → `aspect-[3/5]` + `rounded-full` (on a tall rect `rounded-full` renders as a pill/stadium; NOT `rounded-[50%]` which gives an ellipse — that's the current bug).
- **Top-right (leaf leaning right)**: heavily rounded top-right + bottom-right + top corners, notably tighter on the bottom-left → petal shape.
  → `aspect-[6/5]` with per-corner: `rounded-tl-[45%] rounded-tr-[55%] rounded-br-[55%] rounded-bl-[25%]`.
- **Bottom-right (leaf mirrored)**: mirror of the above vertically — tighter on the top-left.
  → `aspect-[6/5]` with per-corner: `rounded-tl-[25%] rounded-tr-[55%] rounded-br-[55%] rounded-bl-[45%]`.

Each slot gets its own explicit rounding class (no shared prop). Same shape system applied to admin previews so they visually match.

### 2. One static photo per slot (no rotation animation)
Remove auto-rotate, `AnimatePresence`, `PhotoSlot` component, hover-pause, `usePrefersReducedMotion`, staggered delays — all of it.

Each slot renders a single `<img>` with `object-cover`. Entry `FadeUp` on the whole slot stays for a subtle appear.

### 3. Data model change — single image per slot
`PlanYourTripContent.slots` becomes:
```ts
slots: {
  arch: string;      // single imageUrl
  circleA: string;
  circleB: string;
}
```
`PlanPhoto[]` arrays removed. `PlanPhoto` type removed from exports.

Defaults ship the current first photo of each slot. Old localStorage payloads (array shape) are detected and ignored — fall back to defaults so the page never crashes on migration.

### 4. Admin panel simplification
Replace the multi-photo `SlotEditor` / `PhotoCell` block with three single-image upload cards (one per slot). Each card:
- Click-to-upload thumbnail rendered in the slot's actual shape (arch / leaf-A / leaf-B).
- "Remove image" button.
- Reuses `mediaService.upload`, `apiErrorMessage`.

Copy fields (eyebrow/title/description/CTA) and features editor unchanged.

### 5. Cleanup
- Remove `AnimatePresence`, `motion`, `Compass` icon imports only if unused (Compass still used for feature icon — keep).
- `src/services/index.ts` re-export loses `PlanPhoto`.
- `PlanPhoto` deletion cascades: check no other file imports it (only these three do).
