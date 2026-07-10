## Goal
Redesign the site footer in `src/components/layout/footer.tsx` to match the reference: a wide teal-toned landscape silhouette (layered mountains, pine trees, a small family figure on a hill) filling the top of the footer, with link columns and copyright sitting on the dark foreground band below.

## Approach

**1. Landscape illustration (inline SVG)**
- One full-width inline `<svg>` at the top of the footer (viewBox `0 0 1440 480`, `preserveAspectRatio="xMidYMax slice"`, height ~380–460px responsive).
- Layered silhouettes back → front, each a smooth `<path>`:
  - Sky gradient (cream → pale teal) as `<rect>` background.
  - Far mountain range — palest teal (`#cfe0dc`), low jagged peaks.
  - Mid mountains — muted teal (`#7fa8a2`), taller peaks, small lake gap.
  - Pine tree cluster on the left ridge — simple triangular `<polygon>` stacks in `#3d6b66`.
  - Front hill — deep teal (`#264a48`), rolling curve.
  - Family silhouette (parents + 2 kids) as small `<path>` group on the right hill crest, dark teal.
  - Single tall pine on the far right of the front hill.
- Soft fog band — white rect with low opacity + blur filter — between mid and front layers to get the hazy atmosphere.

**2. Foreground link band**
- Below the SVG, a `#1a3d3b` (deep teal) band containing the existing 4 link columns, restyled:
  - Section headings uppercase, small, light teal (`#8fb5b0`).
  - Links in cream/off-white, hover to full white.
  - Columns grouped as in the reference: LEARN | GENERAL (2 sub-cols) | RESOURCES (2 sub-cols).
- Bottom row: copyright left, secondary link right, thin divider above, muted teal text.

**3. Color tokens**
- Use inline hex on the SVG (illustration colors are specific to this scene, not part of the design system).
- Keep link/text colors as Tailwind classes using new local classes or arbitrary values; no changes to `src/styles.css` tokens.

**4. Content**
- Preserve existing link structure (Explore / Company / Legal) but regroup into the 3-heading layout from the reference (LEARN, GENERAL, RESOURCES) using the current links — no new routes.
- Keep brand line + tagline out (reference has none in the link band); move the "Ulmind Travel" wordmark to sit subtly on the front hill as a small serif label, and keep the descriptive tagline in the bottom copyright row.

## Scope
- Only `src/components/layout/footer.tsx`.
- No new assets, no new routes, no token changes.

## Non-goals
- No parallax or animation.
- No changes to header, pages, or other components.
- Not a pixel-perfect trace of the reference figures — silhouettes are stylized approximations in the same palette and composition.
