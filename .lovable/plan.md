## Goal

"Let's Go Together" section er `Learn More` button click korle `/about` page e nibe. Sei About page e:
1. Boro hero banner (2nd screenshot er moto — dark blue overlay er upor "About" title + `Home → About` breadcrumb, full-width, screen-jure)
2. Tar niche shape/collage section (1st screenshot er moto — home er `PlanYourTrip` component ei duplicate visual: 3 rounded shape collage + script eyebrow + boro heading + 2 feature (Exclusive Trip / Professional Guide) + Contact With Us button)

## Changes

### 1. `src/components/home/plan-your-trip.tsx`
- `Link` `to={content.ctaHref}` → hardcode `to="/about"` (or ensure ctaHref points to `/about`) so "Learn More" always goes to About page.

### 2. `src/routes/about.tsx` (rewrite entirely)
Replace current minimal About page with:

**Hero section (like screenshot 2):**
- Full-width banner, ~h-[420px] / lg:h-[520px]
- Background: existing hero image (`hero-slide-maldives.jpg` — ocean/atoll matches reference) with dark blue gradient overlay (`from-ink-900/70`)
- Centered: `<h1>About</h1>` big bold sans (font-sans font-bold text-6xl/7xl text-cream-50)
- Below: breadcrumb `Home → About` (Link Home, arrow icon, About) in cream-50

**Shape/collage section (like screenshot 1):**
- Reuse the exact visual pattern from `PlanYourTrip` component: 2-column grid, left = 3 clipped shape photos collage (archTall + dRight + archBottom via `PlanShapeClipDefs` + `getPlanShapeClipStyle`), right = copy.
- Right column content (About-specific, not from plan-your-trip service):
  - Eyebrow (font-script): "Welcome To Ulmind Travel"
  - Heading (font-serif): "Explore the World with a Trusted Travel Partner"
  - 2 description paragraphs
  - 2 features with icons (Compass = "Exclusive Trip", UserRound = "Professional Guide"), same dark rounded-2xl icon box as PlanYourTrip
  - "Contact With Us" pill button → `/contact`
- Import shape clip helpers + `PlanShapeClipDefs` from `@/components/home/plan-your-trip`, or extract to a shared module. Simplest: import the named exports already exported (`PLAN_SHAPES`, `getPlanShapeClipStyle`, `PlanShapeClipDefs`) from plan-your-trip.tsx.
- Use 3 tour images from `@/assets` (mountain/lake/temple style to match reference feel — e.g. hero-slide-alps, hero-slide-kyoto, hero-slide-rajasthan).

**Head metadata:** keep About-specific title/description/og tags (update to Ulmind about copy).

### 3. Route
`/about` route already exists — no route creation needed. Navbar already links to it.

## Scope

- Existing home sections untouched except the one Link `to` change.
- No backend / no service changes.
- Uses existing design tokens (font-script, font-serif, ink-900, cream-50) — no new colors.
