import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, MapPin, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { LetterReveal } from "@/components/motion/letter-reveal";
import {
  PLAN_SHAPES,
  PlanShapeClipDefs,
  getPlanShapeClipStyle,
  type PlanShapeKey,
} from "@/components/home/plan-your-trip";

import himachal from "@/assets/dest-himachal.jpg";
import andaman from "@/assets/dest-andaman.jpg";
import sundarban from "@/assets/dest-sundarban.jpg";
import kashmir from "@/assets/dest-kashmir.jpg";
import ladakh from "@/assets/dest-ladakh.jpg";
import kerala from "@/assets/dest-kerala.jpg";
import rajasthan from "@/assets/dest-rajasthan.jpg";
import alps from "@/assets/hero-slide-alps.jpg";
import kyoto from "@/assets/hero-slide-kyoto.jpg";
import maldives from "@/assets/hero-slide-maldives.jpg";
import iceland from "@/assets/hero-slide-iceland.jpg";
import santorini from "@/assets/hero-slide-santorini.jpg";
import tuscany from "@/assets/hero-tuscany.jpg";

type DestinationDetail = {
  slug: string;
  name: string;
  region: string;
  eyebrow: string;
  headlinePrefix: string;
  headlineAccent: string;
  tagline: string;
  slides: { imageUrl: string; caption: string }[];
  script: string;
  title: string;
  paragraphs: string[];
  features: { icon: "compass" | "user" | "sparkles"; title: string; description: string }[];
  shapes: { arch: string; circleA: string; circleB: string };
};

const DESTINATIONS: Record<string, DestinationDetail> = {
  himachal: {
    slug: "himachal",
    name: "Himachal",
    region: "Northern Himalaya · India",
    eyebrow: "The Silver Range · Himachal",
    headlinePrefix: "Where clouds",
    headlineAccent: "sleep on cedar.",
    tagline:
      "Pine-forest hush, orchard valleys, and mountain lodges tuned to a slower hour.",
    slides: [
      { imageUrl: himachal, caption: "Deodar forests, Kullu Valley" },
      { imageUrl: alps, caption: "Alpine ridgelines above Manali" },
      { imageUrl: iceland, caption: "Snowlight on the Spiti passes" },
    ],
    script: "A Curated Escape",
    title: "Slow mornings above the pine line.",
    paragraphs: [
      "Himachal moves at the tempo of its rivers. Our residencies are chosen for their windows — walls of glass that open on cedar, deodar and the first light on distant snow. Days begin with quiet, not itineraries.",
      "Private drivers hold the mountain roads, in-house chefs cook from the orchard, and evenings close around a fire. We compose it around your rhythm, not the season's crowd.",
    ],
    features: [
      { icon: "compass", title: "Private Mountain Curators", description: "On-ground guides who know each ridge, each village, each honest kitchen." },
      { icon: "user", title: "Heritage Residencies", description: "Boutique lodges and restored colonial estates, kept small and unhurried." },
    ],
    shapes: { arch: himachal, circleA: alps, circleB: iceland },
  },
  andaman: {
    slug: "andaman",
    name: "Andaman",
    region: "Bay of Bengal · India",
    eyebrow: "Radhanagar Coast · Andaman",
    headlinePrefix: "A quiet blue",
    headlineAccent: "beyond the shore.",
    tagline:
      "House reefs, white-sand crescents, and villas set behind the palms.",
    slides: [
      { imageUrl: andaman, caption: "Radhanagar at first light" },
      { imageUrl: maldives, caption: "House-reef mornings" },
      { imageUrl: santorini, caption: "Sunset from the sandbank" },
    ],
    script: "An Island Sanctuary",
    title: "Days measured by the tide.",
    paragraphs: [
      "The Andamans keep their best hours private. We hold the sandbanks before the day-boats arrive, and reserve dinner tables that face west when the ocean turns copper.",
      "Reef dives with a single instructor, chartered catamarans between the islands, and villas tucked behind the palm line — everything, arranged before you arrive.",
    ],
    features: [
      { icon: "sparkles", title: "Private Charters", description: "Silent catamarans and dive dhows between Havelock, Neil, and the outer atolls." },
      { icon: "compass", title: "Reef-Front Residencies", description: "Villas within reach of a house reef, kept out of sight from public beaches." },
    ],
    shapes: { arch: andaman, circleA: maldives, circleB: santorini },
  },
  sundarban: {
    slug: "sundarban",
    name: "Sundarban",
    region: "Mangrove Delta · Bengal",
    eyebrow: "Bay Delta · Sundarbans",
    headlinePrefix: "The tide holds",
    headlineAccent: "the forest close.",
    tagline:
      "Silent creeks, mangrove light, and lodges that read the water for you.",
    slides: [
      { imageUrl: sundarban, caption: "Mangrove creeks at dawn" },
      { imageUrl: kerala, caption: "Delta light through the palms" },
      { imageUrl: kyoto, caption: "Green hours in the reserve" },
    ],
    script: "A Wild Delta",
    title: "Where the river writes the day.",
    paragraphs: [
      "In the Sundarbans, the guide is the tide. We travel by silent boat through the mangrove channels, holding still where the forest opens — a Bengal tiger, a saltwater crocodile, a hornbill overhead.",
      "Lodges on the outer islands are small and quiet, kitchens lit by lamplight, evenings ended by the sound of water against the hull.",
    ],
    features: [
      { icon: "compass", title: "Naturalist Guides", description: "Wildlife biologists who read the water and the tree line for you." },
      { icon: "user", title: "River-Lodge Stays", description: "Handpicked outposts inside the reserve, held quiet and low-impact." },
    ],
    shapes: { arch: sundarban, circleA: kerala, circleB: kyoto },
  },
  kashmir: {
    slug: "kashmir",
    name: "Kashmir",
    region: "Valley of Lakes · India",
    eyebrow: "Dal Lake · Srinagar",
    headlinePrefix: "A valley held",
    headlineAccent: "by still water.",
    tagline:
      "Chinar avenues, houseboats on Dal, and orchards through the long summer.",
    slides: [
      { imageUrl: kashmir, caption: "Dal Lake at first light" },
      { imageUrl: alps, caption: "Gulmarg meadows in June" },
      { imageUrl: iceland, caption: "Snowlight over Sonmarg" },
    ],
    script: "The Valley Rediscovered",
    title: "Chinar shade, still-water mornings.",
    paragraphs: [
      "Kashmir remembers its own quiet. We keep to the older houseboats on Dal — cedar-panelled, oil-lamped, moored where the light is best — and the family-run guesthouses in the orchards above Pahalgam.",
      "Private shikaras before dawn, saffron fields at harvest, and dinners composed by cooks who have been at the same fires for decades.",
    ],
    features: [
      { icon: "sparkles", title: "Heritage Houseboats", description: "Restored cedar boats on the quiet arm of Dal, moored by candlelight." },
      { icon: "compass", title: "Valley Curators", description: "Guides raised in the valley, opening doors that guidebooks never see." },
    ],
    shapes: { arch: kashmir, circleA: alps, circleB: iceland },
  },
  ladakh: {
    slug: "ladakh",
    name: "Ladakh",
    region: "High Trans-Himalaya · India",
    eyebrow: "The Roof of India · Ladakh",
    headlinePrefix: "Cold blue air,",
    headlineAccent: "a long silence.",
    tagline:
      "Monastery mornings, high-altitude lakes, and the clean silence of the Trans-Himalaya.",
    slides: [
      { imageUrl: ladakh, caption: "Pangong under a clean sky" },
      { imageUrl: iceland, caption: "Nubra dunes at dusk" },
      { imageUrl: alps, caption: "Ridgelines above Leh" },
    ],
    script: "Above The Clouds",
    title: "The high desert, held quietly.",
    paragraphs: [
      "Ladakh is a place of scale. We arrange the acclimatisation the old way — days of stillness before movement — and the monasteries at the hour they belong to, before the light hardens.",
      "Private drivers on the high passes, camp evenings at Pangong with a single fire, and lodges that were homes long before they were opened.",
    ],
    features: [
      { icon: "compass", title: "High-Altitude Guides", description: "Mountaineers who understand the altitude, the passes, and the weather windows." },
      { icon: "user", title: "Monastery Access", description: "Quiet hours at Thiksey, Diskit and Hemis, held for you alone." },
    ],
    shapes: { arch: ladakh, circleA: iceland, circleB: alps },
  },
  kerala: {
    slug: "kerala",
    name: "Kerala",
    region: "Malabar Coast · South India",
    eyebrow: "Backwaters · Kerala",
    headlinePrefix: "A green world",
    headlineAccent: "on slow water.",
    tagline:
      "Teak houseboats, palm-lined canals, and Ayurvedic residencies through the monsoon.",
    slides: [
      { imageUrl: kerala, caption: "Alleppey backwater dawn" },
      { imageUrl: kyoto, caption: "Munnar tea gardens in mist" },
      { imageUrl: tuscany, caption: "Fort Kochi evening light" },
    ],
    script: "God's Own Country",
    title: "The backwaters, unhurried.",
    paragraphs: [
      "Kerala rewards patience. Our teak houseboats move at the pace of the canals, kitchens lit for slow lunches, evenings closed by the sound of coir workers along the banks.",
      "Ayurvedic residencies through the monsoon, chefs cooking from the garden, and days shaped around the light rather than the map.",
    ],
    features: [
      { icon: "sparkles", title: "Private Kettuvallam", description: "Teak-and-coir houseboats chartered end to end, moored where the light is best." },
      { icon: "compass", title: "Ayurvedic Retreats", description: "Doctor-led wellness residencies through monsoon and the cool season." },
    ],
    shapes: { arch: kerala, circleA: kyoto, circleB: tuscany },
  },
  rajasthan: {
    slug: "rajasthan",
    name: "Rajasthan",
    region: "Land of Kings · India",
    eyebrow: "Udaipur · Rajasthan",
    headlinePrefix: "Palace hours,",
    headlineAccent: "lantern quiet.",
    tagline:
      "Haveli residencies, lake-facing courtyards, and desert nights lit by fire.",
    slides: [
      { imageUrl: rajasthan, caption: "Udaipur, lake-facing haveli" },
      { imageUrl: tuscany, caption: "Golden hour over Jaisalmer" },
      { imageUrl: santorini, caption: "Desert nights at Osian" },
    ],
    script: "The Land of Kings",
    title: "Palace evenings, desert firelight.",
    paragraphs: [
      "Rajasthan is theatre. We hold the private zenana dinners at heritage havelis, the marble courtyards facing the lake, and the desert camps that unfold quietly after the day-visitors have gone.",
      "Vintage cars between Jodhpur and Jaisalmer, chefs from the old royal kitchens, and mornings on a rooftop with tea and the muezzin's call.",
    ],
    features: [
      { icon: "sparkles", title: "Royal Residencies", description: "Restored havelis and palace wings — some still lived in by the families." },
      { icon: "compass", title: "Desert Curators", description: "Private camel treks and camps in the deep Thar, held out of sight." },
    ],
    shapes: { arch: rajasthan, circleA: tuscany, circleB: santorini },
  },
};

function getDestination(slug: string): DestinationDetail | null {
  return DESTINATIONS[slug.toLowerCase()] ?? null;
}

export const Route = createFileRoute("/destinations/$slug")({
  loader: ({ params }) => {
    const d = getDestination(params.slug);
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Destination unavailable · Ulmind" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} · Ulmind Travel`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:image", content: loaderData.slides[0]?.imageUrl },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Not found</p>
      <h1 className="mt-4 font-serif text-4xl text-ink-900">This destination is not yet in the portfolio.</h1>
      <Link to="/" className="mt-8 inline-block text-sm uppercase tracking-widest text-ink-900/70 hover:text-ink-900">← Back home</Link>
    </div>
  ),
  component: DestinationDetailPage,
});

const HERO_MS = 5500;

function DestinationHero({ d }: { d: DestinationDetail }) {
  const [index, setIndex] = useState(0);
  const total = d.slides.length;
  const active = d.slides[index]!;

  useEffect(() => {
    if (total <= 1) return;
    const t = window.setTimeout(() => setIndex((n) => (n + 1) % total), HERO_MS);
    return () => window.clearTimeout(t);
  }, [index, total]);

  useEffect(() => {
    const upcoming = d.slides[(index + 1) % total];
    if (!upcoming) return;
    const img = new Image();
    img.src = upcoming.imageUrl;
  }, [index, d.slides, total]);

  return (
    <section className="relative h-[92vh] min-h-[720px] w-full overflow-hidden bg-ink-900">
      <AnimatePresence mode="sync">
        <motion.div
          key={active.imageUrl}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={active.imageUrl}
            alt={active.caption}
            className="h-full w-full object-cover"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.18 }}
            transition={{ duration: 8, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/20 to-ink-900/75" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-16 pt-24 lg:px-10 lg:pb-24">
        <div className="max-w-3xl">
          <nav className="mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cream-50/80">
            <Link to="/" className="hover:text-cream-50">Home</Link>
            <span className="opacity-40">·</span>
            <span>Destinations</span>
            <span className="opacity-40">·</span>
            <span className="text-cream-50">{d.name}</span>
          </nav>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.imageUrl + ":t"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/90">
                {d.eyebrow}
              </p>
              <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-cream-50 sm:text-6xl lg:text-8xl">
                <LetterReveal text={d.headlinePrefix} />
                <br />
                <span className="italic">
                  <LetterReveal text={d.headlineAccent} delay={0.35} />
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-cream-50/85">
                {d.tagline}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-widest text-cream-50/70">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-3.5" /> {d.region}
            </span>
            <span className="opacity-50">·</span>
            <span>Private concierge · 24/7</span>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3 lg:bottom-10 lg:right-10">
        <span className="hidden font-serif text-sm text-cream-50/70 tabular-nums sm:inline">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-2 opacity-40">/</span>
          {String(total).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          {d.slides.map((s, i) => (
            <button
              key={s.imageUrl}
              type="button"
              aria-label={"Slide " + (i + 1)}
              onClick={() => setIndex(i)}
              className="relative h-[2px] w-10 overflow-hidden bg-cream-50/25"
            >
              <motion.span
                className="absolute inset-y-0 left-0 bg-cream-50"
                initial={false}
                animate={{ width: i === index ? "100%" : i < index ? "100%" : "0%" }}
                transition={
                  i === index
                    ? { duration: HERO_MS / 1000, ease: "linear" }
                    : { duration: 0.3 }
                }
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const ICONS = { compass: Compass, user: UserRound, sparkles: Sparkles } as const;

function DestinationDetailPage() {
  const d = Route.useLoaderData() as DestinationDetail;

  const shapeSlots: { key: PlanShapeKey; imageUrl: string }[] = [
    { key: "archTall", imageUrl: d.shapes.arch },
    { key: "dRight", imageUrl: d.shapes.circleA },
    { key: "archBottom", imageUrl: d.shapes.circleB },
  ];

  return (
    <div>
      <DestinationHero d={d} />

      {/* Shape section: text left, shapes right */}
      <section className="relative bg-cream-50 py-24 lg:py-32">
        <PlanShapeClipDefs />
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
            {/* Copy — left */}
            <div>
              <FadeUp>
                <p className="font-script text-3xl text-ink-900/80 sm:text-4xl">
                  {d.script}
                </p>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
                  {d.title}
                </h2>
                {d.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="mt-6 max-w-xl text-base leading-relaxed text-ink-900/60 sm:text-lg"
                  >
                    {p}
                  </p>
                ))}
              </FadeUp>

              <div className="mt-10 space-y-8">
                {d.features.map((f, i) => {
                  const Icon = ICONS[f.icon];
                  return (
                    <FadeUp key={f.title} delay={0.05 * (i + 1)}>
                      <div className="flex items-start gap-5">
                        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-900 text-cream-50 shadow-[0_15px_30px_-15px_rgba(28,25,23,0.5)]">
                          <Icon className="size-6" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-serif text-2xl text-ink-900">{f.title}</h3>
                          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-900/60">
                            {f.description}
                          </p>
                        </div>
                      </div>
                    </FadeUp>
                  );
                })}
              </div>

              <FadeUp delay={0.25}>
                <Link
                  to="/contact"
                  className="mt-12 inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 text-xs uppercase tracking-[0.25em] text-cream-50 transition-transform hover:-translate-y-0.5"
                >
                  Begin Your Journey
                  <ArrowRight className="size-4" />
                </Link>
              </FadeUp>
            </div>

            {/* Shapes — right */}
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 top-10 hidden size-64 rounded-full bg-cream-100/80 blur-3xl lg:block"
              />
              <div className="relative mx-auto grid max-w-[620px] grid-cols-2 gap-4 sm:gap-5">
                <FadeUp>
                  <ShapePhoto imageUrl={shapeSlots[0]!.imageUrl} shape={shapeSlots[0]!.key} />
                </FadeUp>
                <div className="flex flex-col gap-4 sm:gap-5">
                  <FadeUp delay={0.08}>
                    <ShapePhoto imageUrl={shapeSlots[1]!.imageUrl} shape={shapeSlots[1]!.key} />
                  </FadeUp>
                  <FadeUp delay={0.16}>
                    <ShapePhoto imageUrl={shapeSlots[2]!.imageUrl} shape={shapeSlots[2]!.key} />
                  </FadeUp>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function ShapePhoto({ imageUrl, shape }: { imageUrl: string; shape: PlanShapeKey }) {
  const s = PLAN_SHAPES[shape];
  return (
    <div className={"relative w-full drop-shadow-[0_30px_35px_rgba(28,25,23,0.18)] " + s.aspect}>
      <div
        className="h-full w-full overflow-hidden bg-cream-100 ring-1 ring-ink-900/5"
        style={getPlanShapeClipStyle(shape)}
      >
        <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}