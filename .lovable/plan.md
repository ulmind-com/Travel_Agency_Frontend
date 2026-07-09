Reference image shows a cursive/handwritten script font for the small eyebrow label ('Best Place For You') above the 'Most Popular Tour' heading. Current site uses italic Cormorant Garamond for that eyebrow.

Plan:
1. Install a matching script font (e.g., @fontsource/dancing-script) that closely resembles the reference's cursive style.
2. Add a new `--font-script` token in `src/styles.css` and load the font in `src/routes/__root.tsx`.
3. Apply the script font to the eyebrow text in `src/components/home/popular-tours.tsx` while keeping the rest of the section typography unchanged.
4. Verify the visual match against the reference in the live preview.

Scope: only the eyebrow font change for the Popular Tours section. If you want the same script font on other eyebrow labels across the site, let me know and I will extend it.