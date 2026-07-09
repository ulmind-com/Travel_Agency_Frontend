
# Hero — Cinematic Rotating Backgrounds + Slide-Synced Copy

Upgrade the home Hero into an ultra-premium, auto-rotating cinematic showcase. Nav bar stays fixed; only the hero background, headline, subtitle, and eyebrow change per slide with smooth crossfade + Ken Burns zoom + letter-reveal on the new text.

Admin can upload / manage these hero slides from a new admin screen (Phase 2 was deferred, but this one admin surface ships now because the feature depends on it).

---

## User-facing behavior

- 5–6 slides cycle automatically every ~6s (pauseable on hover, respects `prefers-reduced-motion`).
- Each slide: full-bleed background image + eyebrow + serif headline (with italic accent word) + one-line subtitle.
- **Transition**: previous image crossfades out (opacity + subtle scale 1.05 → 1) while next fades in with a slow 8s Ken Burns zoom. Text swaps with a stagger: eyebrow slides up, headline runs letter-reveal, subtitle fades. Search card and CTA row stay put — they do NOT re-mount.
- Progress rail on the right shows N segments; the active segment fills over the slide duration. Click a segment to jump. Prev/next chevrons at bottom-left. Swipe on touch.
- Preloads next image so no flash.
- First slide's image gets `fetchPriority="high"`; the rest lazy-load.

## Data source

Backend already exposes `/api/v1/media/upload`. We add a `hero_slides` concept.

- If a `GET /api/v1/hero-slides` (or similar) endpoint exists in the OpenAPI, use it.
- If not, the backend has no CRUD for hero slides yet. Two options — I'll ask below.

For Phase 1 shipping now, the hero reads slides via `heroSlidesService.list()` with a **local fallback**: if the endpoint is missing / empty, it falls back to a bundled default set of 6 curated images + copy so the site never renders an empty hero.

## Admin upload UI (minimal, ships with this change)

New route: `/_authenticated/admin/hero` — gated by `has_role('admin')` check against `/auth/me` (or a role field on the user). Non-admin users get redirected to `/account`.

Screen contains:
- Drag-and-drop uploader (uses existing `mediaService.upload`).
- List of current slides with drag-to-reorder, eyebrow / headline / italic-accent / subtitle fields inline, active toggle, delete.
- Save persists via slides endpoint.

If the backend has no slides endpoint, the admin screen still uploads images (media endpoint works) and stores slide metadata in `localStorage` as a stopgap so you can preview the flow; a one-line service swap wires it to the real endpoint once you add it.

## Files

```
src/components/home/hero.tsx                    rewrite — slide engine + AnimatePresence
src/components/home/hero-slide.tsx              new — single slide (bg + text + Ken Burns)
src/components/home/hero-progress.tsx           new — segmented progress rail
src/services/hero-slides.service.ts             new — list/create/update/delete/reorder
src/services/media.service.ts                   new — upload wrapper (was referenced, not created)
src/lib/queries.ts                              add heroSlidesQuery
src/routes/_authenticated.admin.hero.tsx        new — admin CRUD screen
src/components/admin/hero-slide-form.tsx        new — per-slide form row
src/components/admin/image-dropzone.tsx         new — reusable uploader
src/assets/hero-slide-{1..6}.jpg                new — generated fallback images
src/lib/auth-context.tsx                        add isAdmin derived from /auth/me
src/components/layout/navbar.tsx                show "Admin" link when isAdmin
```

## Motion details

- Framer Motion `AnimatePresence mode="popLayout"` on the slide layer.
- Background: `initial={{opacity:0, scale:1.08}} animate={{opacity:1, scale:1}} exit={{opacity:0}}` — 1.2s ease `[0.22,1,0.36,1]`; then a continuous 8s scale to 1.12 while active (Ken Burns).
- Text layer: stagger 0.08 — eyebrow (y 12→0), headline via existing `LetterReveal` keyed on slide id so it re-runs, subtitle fade.
- Progress bar: CSS transform scaleX driven by `motion.div` with duration = slide duration; resets on slide change.

## Accessibility & perf

- `aria-roledescription="carousel"`, live region announces slide headline changes.
- Reduced motion → no Ken Burns, instant crossfade, autoplay off.
- Images served through existing asset pipeline (`import` for defaults, absolute URL for admin-uploaded).
- Only mount 2 slides at once (current + next preloader).

## Not included (deliberately)

- Full admin dashboard (packages, bookings, promos) — still Phase 2.
- Video backgrounds — image only for now.
- Per-slide CTA override — CTA row stays global.

## Diagram

```text
Hero
├── <SlideLayer> ─ AnimatePresence
│    ├── HeroSlide (bg image + Ken Burns)
│    └── HeroSlide.Text (eyebrow / headline / subtitle)
├── <SearchCard>            (static, does not re-mount)
├── <HeroProgress>          (segments, click-to-jump)
└── <PrevNext>              (chevrons + swipe)

heroSlidesQuery ── /hero-slides ──► backend
        └── fallback: bundled 6 defaults if empty / 404

Admin /admin/hero
├── ImageDropzone → mediaService.upload → url
└── HeroSlideForm[] → heroSlidesService.upsert/reorder/delete
```

---

## Two questions before I build

1. **Admin role source**: does `/auth/me` return a role/is_admin flag, or should I gate the admin screen by a hardcoded admin email list in env for now (`VITE_ADMIN_EMAILS`) until you add a role field?
2. **Slides endpoint**: is there an existing hero/slides endpoint in the Swagger I missed, or should I ship with the localStorage stopgap + `mediaService.upload` for images, and wire to a real endpoint later?

Approve and I'll build.
