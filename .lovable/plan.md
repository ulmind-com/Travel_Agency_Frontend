Plan: Premium Ulmind mega-menu navbar + Gallery + Blogs

Interpretation of the request
- The attached screenshot shows a clean horizontal nav: Home, About Us, Destination (with India/International sub-menus), Gallery, Blogs, Contact Us.
- The user wants the same structure and dropdown behavior, but executed in the Ulmind premium style already established on the home hero and contact page.
- We will create the missing Gallery and Blogs pages so the new nav links are real.

Scope
- Only frontend/presentation changes. No backend or auth changes.

Changes

1. Redesign `src/components/layout/navbar.tsx`
   - Keep the Ulmind logo on the left.
   - Desktop nav items: Home, About Us, Destinations, Gallery, Blogs, Contact Us.
   - Destinations becomes a mega-dropdown:
     - Left column: "India" with regions East India, North India, West India, South India.
     - Right column: "International" with popular regions or top destinations.
     - Each item links to `/packages` with a destination search filter (or to dedicated destination slug pages where available).
   - Styling matches the Ulmind premium language:
     - Cream-50 background, ink-900 text, subtle gold accents, Cormorant Garamond serif headings.
     - Backdrop blur and 1px ink-900/5 borders on the dropdown card.
     - Smooth fade/slide open animation, refined hover states, elegant underline cues.
   - Mobile: full-screen menu with an accordion for the Destinations sub-items.
   - Preserve auth/account actions on the right (Sign in / Inquire / Account / Admin / Sign out).

2. Create `src/routes/gallery.tsx`
   - Leaf route `/gallery`.
   - Hero banner + masonry/image-grid gallery section.
   - Use existing travel assets where possible and add route-specific `head()` metadata.
   - Premium styling consistent with About and Contact.

3. Create `src/routes/blogs.tsx`
   - Leaf route `/blogs`.
   - Hero banner + editorial article/blog list grid.
   - Use placeholder editorial content for now (no CMS backend).
   - Premium styling and `head()` metadata.

4. Update `src/routes/about.tsx` if needed
   - The About page already exists; no content change unless small nav integration polish is required.

5. Update `src/routeTree.gen.ts` automatically
   - New routes will be picked up by the TanStack Router Vite plugin; no manual edits.

No new dependencies
- Reuse `framer-motion`, `lucide-react`, `sonner`, existing design tokens, and shared components (`Container`, `FadeUp`, `LetterReveal`).

Verification
- Run build/typecheck to confirm route generation and imports.
- Visually verify the dropdown opens/closes on desktop and the mobile accordion works.

Open question
- The user selected "Current Ulmind labels" in the last question, but the reference screenshot and the request to create Gallery/Blogs pages imply the nav should follow the screenshot structure. This plan uses the screenshot structure (Home, About Us, Destinations, Gallery, Blogs, Contact Us). If you prefer to keep the original Ulmind labels (Destinations, Collections, The Journal, Concierge), we can adjust the plan before building.