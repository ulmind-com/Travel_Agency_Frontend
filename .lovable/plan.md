## Contact page — ultra premium redesign

Rebuild `src/routes/contact.tsx` to match the destination-page premium language (full-screen editorial hero, shape section, dark closing band).

### 1. Full-screen hero
- `h-screen min-h-screen` like Home / destination pages.
- Background: rotating slideshow (3 slides, Ken-Burns zoom, crossfade) reusing hero images (Maldives, Kyoto, Alps) with dark ink gradient overlay.
- Content bottom-left: breadcrumb `Home · Contact`, eyebrow "The Concierge · Ulmind", huge serif headline using `LetterReveal`:
  - "Tell us where" / *"you dream of."*
- Sub-tagline under headline. Meta row: `MapPin` Kolkata · India · Private concierge 24/7.
- Slide indicators (progress rails + numeric counter) bottom-right — same component style as destination hero.

### 2. Editorial "Reach the concierge" section (cream background)
Two-column grid like destination detail:
- **Left column**: script line ("A Private Line"), serif H2 "One conversation, an entire journey.", two paragraphs, then three icon-feature blocks:
  - Phone → Direct concierge line (numbers stacked)
  - Mail → Written concierge (emails stacked)
  - MessageCircle → WhatsApp · 09:00–22:00 IST
  - MapPin → Kolkata studio address
- **Right column**: form as a floating card with cream ring + heavy drop-shadow, over a soft cream-100 blur blob (like destination shape well).
  - Fields: Full name, Email, Phone, Dream destination, Message.
  - Ink-900 pill submit button "Send to concierge" with arrow icon, hover lift.
  - Keeps existing sonner toast + fake submit; no backend change.

### 3. Bank / trust strip (optional light band)
A slim editorial strip with three trust cues: "Private advisors", "24/7 concierge", "Bespoke itineraries" — small serif, ink-900/60, divider dots.

### 4. Closing CTA band (dark, ink-900)
- Full-width dark section with cream text, script line "Ready when you are", serif line "Begin a private conversation.", and a cream pill button that scrolls to the form.

### Technical notes
- Reuse `Container`, `FadeUp`, `LetterReveal`, `PlanShapeClipDefs` already in codebase.
- Uses existing image imports from `@/assets/hero-slide-*`.
- No new deps, no backend changes.
- Head metadata: keep current, add matching `og:image` (first hero slide).

Files touched: `src/routes/contact.tsx` only.
