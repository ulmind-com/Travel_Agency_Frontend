# Ultra-Premium Admin Panel Redesign

## Goals
1. Fix sidebar scroll issue — left sidebar should stay visible (sticky) while the content area scrolls.
2. Give the entire admin panel a cohesive, premium, travel-brand aesthetic — matching the elegant cream/ink/serif language of the public site, but elevated for a "back-of-house" studio feel.
3. Redesign every admin page (Hero, Tour Categories, Popular Destinations, Plan Your Trip, Popular Tours, Recent Gallery, Achievements) to feel like a luxury CMS, not a form dump.

## Design Language
- **Palette:** cream-50 canvas, ink-900 primary, a new soft accent (warm brass / muted teal — TBD), subtle glass panels with `border-ink-900/8` + `bg-white/70 backdrop-blur`.
- **Typography:** serif display for page titles + eyebrow tracking-widest labels; small-caps section headings.
- **Cards:** rounded-3xl, layered shadow (`shadow-[0_1px_0_rgba(0,0,0,0.04),0_20px_40px_-24px_rgba(15,43,43,0.18)]`), 1px hairline borders.
- **Inputs:** floating-label style, cream fill, ink underline on focus, generous padding.
- **Buttons:** pill primary (ink → deep teal gradient), ghost secondary, destructive as bordered outline.
- **Micro-interactions:** hover lift on cards, focus ring in brand tone, animated Publish button with success pulse.

## Layout Changes (`_authenticated.account.tsx`)
- Convert the account layout to a two-column shell where the sidebar column is `sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto` on `lg:` — so scrolling the page keeps the sidebar pinned.
- Add a slim top "Admin Studio" bar above content on admin routes (breadcrumb + last-saved indicator + Publish CTA slot).
- Give the account shell a subtle background texture (cream with faint gradient wash) so the white cards pop.

## Sidebar Redesign (`components/account/sidebar.tsx`)
- Group items into "Account" and "Admin · Content" with small-caps group labels and a hairline divider.
- Active item: filled ink pill + soft glow; inactive: icon in muted ink, hover reveals accent underline.
- Add a footer block in the sidebar (avatar, name, role badge, quick logout).
- Mobile: horizontal scroll chip rail (keep current behavior, restyled).

## Per-Page Redesigns (all 7 admin routes)
Shared pattern for each:
1. **Hero header** — eyebrow ("Admin · Homepage"), serif H1, one-line description, right-aligned action cluster (Reset ghost + Publish primary with save-state icon).
2. **Content sections** framed as labeled "cards" (e.g. "Section header", "Slides", "Stats") with generous spacing.
3. **List/grid items** (slides, categories, tours, gallery slots, etc.) rendered as premium cards: image preview left, editable fields right on desktop; stacked on mobile. Drag handle affordance where reorder exists.
4. **Image upload zones** — large dashed drop targets with iconography, hover state, uploading spinner overlay, "Replace / Remove" chip row.
5. **Empty states** — illustrated placeholder + "Add first item" CTA.
6. **Sticky action bar** at bottom of the viewport on scroll (Reset / Publish) so admins never lose the save button.

Page-specific tweaks:
- **Hero:** slide cards show live aspect-ratio preview with overlaid title, order controls as up/down arrows.
- **Tour categories / Popular destinations / Popular tours:** grid of card editors, matching the public-site card shape so admin sees exactly what the visitor sees.
- **Plan your trip:** step editor with numbered rail on the left.
- **Recent gallery:** 5-slot collage editor visualized as the actual homepage collage layout, click any slot to swap.
- **Achievements:** 4 circular stat editors laid out like the live section.

## Technical Notes
- Introduce a shared `AdminPageHeader`, `AdminCard`, `AdminField`, `AdminStickyActions` in `src/components/admin/` to keep every page consistent and reduce duplication.
- Add a `useStickyActions` helper (IntersectionObserver) for the floating save bar.
- No backend/service changes — pure presentation.
- Add tokens (accent color, shadow) to `src/styles.css` under `@theme`.

## Out of Scope
- No changes to services, data models, or auth.
- Public site UI untouched.

## Deliverables
- Updated `_authenticated.account.tsx` (sticky sidebar + admin shell).
- Redesigned `components/account/sidebar.tsx`.
- New shared admin components in `src/components/admin/`.
- All 7 admin route files restyled to the new system.
- Token additions in `src/styles.css`.
