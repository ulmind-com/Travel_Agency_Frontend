## Goal
Redesign the **About page hero/top section** in `src/routes/about.tsx` to visually match the uploaded reference — a teal-green background with angled diagonal photo panels on the right — while keeping all existing About page copy intact.

## Reference reading
From the uploaded image:
- Solid muted teal/green background (approx `#5FA79A` / sage-teal).
- Large bold white sans-serif headline on the left ("TRAVEL / THE WORLD" style).
- Italic pull-quote in white below the headline.
- Smaller lorem paragraph under it in lighter white.
- Dark rounded "BOOK NOW" pill button.
- Right side: **three diagonal parallel strips** at ~65° angle, each strip filled with a landscape photo, bottom edges rounded like elongated capsules. Strips overlap the top-right and bottom-right of the frame.
- Small dotted-grid decorative squares scattered (top-right, mid-left, bottom).

## Scope
- Only edit `src/routes/about.tsx`.
- Replace the current dark hero banner (`heroBg` with `About` + breadcrumb) with a new **teal hero block** matching the reference.
- Keep the existing "Welcome To Ulmind Travel" collage section below completely untouched.
- Keep all existing About text: reuse the current heading/subtitle/paragraph copy inside the new hero layout (no new lorem — user said "jemon lekha ache ota to thakbei").

## New hero layout (left → right)
Left column (~55% width):
- Kicker: small white uppercase "About Ulmind Travel" (existing eyebrow feel).
- H1: `About` (kept, but restyled — bold sans, huge, white, tight tracking, two-line stacked like "TRAVEL / THE WORLD").
- Italic quote line pulled from existing subtitle ("Explore the world with a trusted travel partner").
- Short paragraph: first existing About paragraph, trimmed to ~3 lines, white/80.
- Rounded dark pill CTA → `/contact` labeled "Book Now" (matches reference button).
- Row of small social icon circles (Instagram, Facebook, Twitter) — decorative, matches reference.

Right column (~45% width, absolutely positioned inside hero):
- Three diagonal photo strips using existing imported images (`heroBg` maldives, `shapeAlps`, `shapeKyoto`).
- Each strip: fixed width (~180–220px), tall enough to bleed off top and bottom, `rounded-full` bottom, rotated `-25deg`, staggered horizontally with slight overlap.
- Implemented via absolutely-positioned divs with `transform: rotate(-25deg)`, `overflow-hidden`, `rounded-[9999px]`, and an `<img>` inside with `object-cover` + counter-scale so the photo fills the tilted strip cleanly.
- Soft shadow under each strip for depth.

Decorative accents:
- Two small 4×4 dotted-grid squares (CSS radial-gradient dots) positioned top-right area and bottom-left area.
- Small arrow chevrons (`»`) beside the headline like the reference.

## Colors (inline via arbitrary Tailwind — no token file changes)
- Hero background: `bg-[#5FA79A]`.
- Text: white / white/80.
- CTA: `bg-ink-900 text-cream-50 rounded-full`.
- Dots: `text-white/40`.

## Technical notes
```text
<section class="relative overflow-hidden bg-[#5FA79A] min-h-[620px] lg:min-h-[720px]">
  <Container> grid lg:grid-cols-[1.1fr_1fr]
    left: kicker, h1, quote, paragraph, CTA, socials
    right: relative h-full
      3x <div class="absolute rotate-[-25deg] rounded-full overflow-hidden shadow-2xl">
            <img class="h-full w-full object-cover scale-125" />
          </div>
  decorative dot grids as absolute divs with background-image radial-gradient
</section>
```
Breadcrumb from current hero is removed (reference has no breadcrumb). If you want to keep it, say so and I'll tuck it above the kicker in muted white.

## Non-goals
- No changes to the collage section, navbar, footer, or any other route.
- No new image assets — reuse `heroBg`, `shapeAlps`, `shapeKyoto` already imported.
- No new dependencies.
