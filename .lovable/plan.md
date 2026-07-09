
# Ulmind Travel — Phase 1 Plan (Customer Site)

Stack: **TanStack Start** (React 19 + Vite + Tailwind v4) with **TanStack Router + TanStack Query**, **Axios** for backend calls, **Zod + React Hook Form**, **Framer Motion + Lenis** for motion, **Sonner** toasts, **Lucide** icons. No Lovable Cloud / Supabase — backend is the existing Render API. Redux Toolkit and 3D globe / admin panel are explicitly **deferred to Phase 2**.

Design direction: **Warm cream editorial (v2)** — Cormorant Garamond serif + Inter sans, cream `#fdfcf7 / #f9f7f0` on ink `#1c1917`, glass search card, editorial imagery, restrained motion.

---

## What ships in Phase 1

**Pages / routes** (all under `src/routes/`, file-based)

```
/                          Home (hero + search, stats, featured packages, collections, testimonial, CTA)
/packages                  List — filter (category/price/destination), sort, pagination, wishlist toggle
/packages/$id              Detail — gallery, itinerary tabs, pricing, sticky booking panel, reviews, related
/auth/login                Login
/auth/register             Register
/_authenticated/account            Dashboard overview
/_authenticated/account/bookings   My bookings + cancel request
/_authenticated/account/wishlist   Saved packages
/_authenticated/account/travelers  Saved travelers CRUD
/_authenticated/account/profile    Profile (from /auth/me)
/_authenticated/book/$id           Booking flow (date → travelers → seat lock → promo → Razorpay → verify)
/_authenticated/book/success/$bookingId  Success + QR-style ticket
/about, /contact           Static editorial pages
```

Root `__root.tsx`: Navbar + Footer + `<Toaster />` + Lenis smooth scroll + QueryClientProvider (already wired in template).

**Auth**
- Email/password against `POST /api/v1/auth/register` and `POST /api/v1/auth/login`.
- JWT stored in `localStorage` (`ulmind_token`). Axios request interceptor attaches `Authorization: Bearer`; response interceptor on 401 clears token and redirects to `/auth/login?redirect=…`.
- `/auth/me` hydrates a lightweight `AuthContext` at app boot (via TanStack Query). `_authenticated` layout gates on that context and redirects unauthenticated users to `/auth/login`.
- No refresh endpoint in backend → treat 401 as re-login.

**Backend integration (all 30 endpoints touched in Phase 1 unless marked admin)**

Service layer at `src/services/` (Axios instance from `src/lib/api.ts`):
- `auth.service.ts` — register, login, me
- `packages.service.ts` — list (public), detail, `/public/packages`
- `bookings.service.ts` — create, my-bookings, request-cancel
- `inventory.service.ts` — lock-seats
- `payments.service.ts` — initiate, verify (Razorpay checkout)
- `reviews.service.ts` — list by package, create
- `wishlist.service.ts` — add/remove, list
- `travelers.service.ts` — list, create, update, delete
- `waitlist.service.ts` — join
- `recommendations.service.ts` — personalized, trending
- `media.service.ts` — upload (used in profile avatar / review photos)
- `promos.service.ts` — apply promo (client-side; admin CRUD deferred)

Admin-only endpoints (`/admin/*`, `/checkin/scan`, `ml/train`, `packages POST/DELETE`) are wired in service layer but **UI is Phase 2**.

**Data fetching pattern** (canonical for this template):
```ts
loader: ({ context }) => context.queryClient.ensureQueryData(packagesQuery(deps))
component → useSuspenseQuery(packagesQuery(deps))
```
URL search params (`?category=&price=&page=`) via `validateSearch` — not `useState`.

**Booking + Razorpay flow**
1. `POST /bookings` → returns booking id.
2. `POST /inventory/lock-seats` with booking id + seat count.
3. Optional promo (client-side validate against admin promo list if available; else send in payment payload).
4. `POST /payments/initiate` → Razorpay order id.
5. Open Razorpay checkout (script loaded from `checkout.razorpay.com/v1/checkout.js` in `__root.tsx` head).
6. On success handler → `POST /payments/verify` with `razorpay_payment_id/order_id/signature`.
7. Redirect to `/account/book/success/$bookingId` with QR (generated client-side from booking id via `qrcode` npm).

**Motion**
- Lenis smooth scroll (root provider).
- Framer Motion: hero heading letter reveal, section fade-up on scroll, card image zoom on hover, magnetic primary CTA, sticky booking panel slide-in.
- No GSAP / R3F in Phase 1 (defer with 3D globe).

**Global**
- Sonner toasts for all mutations (success/error).
- Skeletons for list/detail loading (route `pendingComponent`).
- `errorComponent` + `notFoundComponent` on every route with a loader.
- SEO via per-route `head()` (title, description, og:*) — home + packages get real metadata; leaf `/packages/$id` derives og from loader data.
- Responsive: mobile-first, tested at 375 / 768 / 1440.

## Technical details

**Files added / changed**

```
src/
  lib/api.ts                    Axios instance + interceptors
  lib/auth.ts                   token storage + AuthContext + useAuth
  lib/razorpay.ts               loadRazorpayScript + openCheckout
  lib/queries/*.ts              queryOptions factories per resource
  services/*.service.ts         (list above)
  types/api.ts                  zod schemas + inferred TS types for all responses
  components/
    layout/{Navbar,Footer,Container,PageTransition}.tsx
    ui/{Button,Input,Card,Badge,Skeleton,Dialog,Sheet,Tabs,Accordion}.tsx  (shadcn-flavored, cream tokens)
    home/{Hero,SearchCard,StatsRow,FeaturedPackages,CollectionsScroll,Testimonial,CtaFooter}.tsx
    packages/{FilterBar,PackageCard,PackageGrid,Pagination,WishlistButton}.tsx
    package-detail/{Gallery,ItineraryTabs,PriceBox,ReviewsSection,RelatedPackages,BookingPanel}.tsx
    booking/{DateStep,TravelersStep,PromoStep,PaymentStep,SuccessCard}.tsx
    account/{Sidebar,BookingRow,TravelerForm,ProfileForm}.tsx
    motion/{FadeUp,LetterReveal,MagneticButton}.tsx
  routes/                       (as listed above; __root.tsx updated with Lenis + Razorpay script)
  styles.css                    cream/ink tokens + Cormorant/Inter fonts via @fontsource-variable
  assets/                       generated hero + collection images (src/assets, imported)
```

**Env** — `.env` with `VITE_API_BASE_URL`, `VITE_APP_NAME=Ulmind Travel`, `VITE_RAZORPAY_KEY_ID` (publishable, safe in client). Google Maps deferred.

**Backend response contracts**: I'll pull the full OpenAPI JSON at build time and define Zod schemas that match — you don't need to paste anything. If any endpoint returns a shape different from Swagger, we adjust the schema in one place.

**What is NOT in Phase 1** (explicit to avoid scope creep — Phase 2 backlog):
- Admin dashboard (packages/bookings/promos/analytics CRUD, ML train)
- 3D globe hero (R3F/Drei), Three.js scenes
- Redux Toolkit (TanStack Query covers server state; Context handles auth/UI — Redux adds no value in Phase 1)
- GSAP, Lottie, Swiper, Embla, Instagram feed, Blog, PWA install, dark mode, i18n
- Compare packages, recently-viewed persistence, notifications center
- Waitlist notification UI beyond "join" (backend has no notification endpoint)

## Diagram

```text
Browser ── TanStack Router ── loader ── QueryClient ── axios (Bearer) ── Render API
                │                                            │
                ├── Auth gate (_authenticated)              JWT (localStorage)
                ├── Route pendingComponent (Skeletons)
                └── Booking → Razorpay checkout → verify → success/QR
```

Ready to build Phase 1. On approval, next step is to install deps (`axios @tanstack/react-query zod react-hook-form @hookform/resolvers sonner lucide-react lenis framer-motion qrcode @fontsource-variable/cormorant-garamond @fontsource-variable/inter`), scaffold the service + auth layer against the OpenAPI schema, and build routes top-down starting with root layout + Home.
