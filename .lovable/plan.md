## Goal
Hero-er background photo gulo auto-advance korbe (ekta slide ses hole automatic next slide) — smooth crossfade shoho, click/swipe ba wait chara.

## Current state
`src/components/home/hero.tsx` te already ekta autoplay logic ache:
- `SLIDE_DURATION_MS = 6500` per slide
- `useEffect` + `setTimeout(next, 6500)` → next slide
- Pause condition: `reduced || paused || total <= 1`
- `paused` set hoy `onMouseEnter` (true) / `onMouseLeave` (false) — desktop e mouse hero-er upor thakle slide change hobe na

Sombhaboto issue: desktop e cursor hero er upor thakay `paused=true` hoye autoplay atke ache — tai user ke mone hocche "automatic hocche na".

## Fix (chhoto, UI-only)
1. **Hover-pause remove koro** — `onMouseEnter` / `onMouseLeave` handler tule dao section theke. Slides continuously cycle korbe cursor kothay setar upor depend korbe na.
2. **Focus-within pause rakho (accessibility)** — jodi user search card er kono input focus kore, tokhon pause korbe (form fill korar somoy background jhamela na kore). Implementation: `onFocus`/`onBlur` capture handlers using a `focused` state, replacing `paused`.
3. **Interval sync-safe rakho** — `setTimeout` er dependency array ache already (`index` change hole timer reset hoy), setai thakbe.
4. **Progress rail o counter unchanged** — already index er upor animate kore, tai autoplay chalu holei ogulo sync te chole asbe.

## Verify
- Preview e `/` te giye 6.5s wait kore dekhbo photo 1 → 2 crossfade holo kina (Playwright screenshot at t=0, t=7s, t=14s).
- Prev/Next button, swipe, aar keyboard focus behavior manually check.
- Console e kono warning ase kina check.

## Files
- `src/components/home/hero.tsx` — hover pause handlers baad, focus-within pause add.

Onno kono file, service, ba route change hobe na. Admin-uploaded slides + default slides duitoi same auto-cycle e cholbe.
