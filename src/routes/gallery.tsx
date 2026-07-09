import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { LetterReveal } from "@/components/motion/letter-reveal";

import gallery1 from "@/assets/gallery-1_sikkim-clean.jpg";
import gallery2 from "@/assets/gallery-2_kashmir-clean.jpg";
import gallery3 from "@/assets/gallery-3_lakshadweep-clean.jpg";
import gallery4 from "@/assets/gallery-4_darjeeling-clean.jpg";
import gallery5 from "@/assets/gallery-5_vietnam-clean.jpg";
import heroBg from "@/assets/hero-slide-rajasthan.jpg";
import alps from "@/assets/hero-slide-alps.jpg";
import maldives from "@/assets/hero-slide-maldives.jpg";
import kyoto from "@/assets/hero-slide-kyoto.jpg";
import santorini from "@/assets/hero-slide-santorini.jpg";
import iceland from "@/assets/hero-slide-iceland.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery · Ulmind Travel" },
      {
        name: "description",
        content:
          "A curated visual journal of escapes, landscapes, and quiet moments composed by Ulmind Travel.",
      },
      { property: "og:title", content: "Gallery · Ulmind Travel" },
      {
        property: "og:description",
        content:
          "A curated visual journal of escapes, landscapes, and quiet moments composed by Ulmind Travel.",
      },
      { property: "og:image", content: gallery2 },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryPage,
});

const IMAGES = [
  { src: gallery2, alt: "Kashmir — Snow-dusted pines and silent valleys", location: "Kashmir", span: "md:col-span-2 md:row-span-2" },
  { src: gallery1, alt: "Sikkim — Prayer flags over high-altitude trails", location: "Sikkim", span: "" },
  { src: gallery3, alt: "Lakshadweep — Turquoise shallows and coral light", location: "Lakshadweep", span: "md:row-span-2" },
  { src: gallery4, alt: "Darjeeling — Mist rolling over tea gardens", location: "Darjeeling", span: "" },
  { src: gallery5, alt: "Vietnam — Limestone karsts at golden hour", location: "Vietnam", span: "md:col-span-2" },
  { src: alps, alt: "St. Moritz — Alpine stillness above the treeline", location: "St. Moritz", span: "" },
  { src: maldives, alt: "Maldives — Reef mornings over the Indian Ocean", location: "Maldives", span: "md:row-span-2" },
  { src: kyoto, alt: "Kyoto — Bamboo paths and temple gardens", location: "Kyoto", span: "" },
  { src: santorini, alt: "Santorini — Whitewashed curves over the caldera", location: "Santorini", span: "" },
  { src: iceland, alt: "Iceland — Volcanic coast under Arctic light", location: "Iceland", span: "md:col-span-2" },
];

function GalleryPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[420px] w-full overflow-hidden lg:h-[520px]">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/55 to-ink-900/70" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 text-center text-cream-50">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/80">
            Visual Journal
          </p>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            <LetterReveal text="Captured" />
            <br />
            <span className="italic">
              <LetterReveal text="escapes." delay={0.3} />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-50/80">
            A quiet gallery of moments — light, landscape, and the places that
            stay with you long after you return.
          </p>
        </div>
      </section>

      {/* Masonry grid */}
      <section className="bg-cream-50 py-20 lg:py-28">
        <Container>
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Selected frames
            </p>
            <h2 className="mt-4 font-serif text-4xl font-medium text-ink-900 md:text-5xl">
              Light, gathered from the journey.
            </h2>
          </FadeUp>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {IMAGES.map((img, i) => (
              <FadeUp
                key={img.alt}
                delay={0.05 * (i % 4)}
                className={img.span}
              >
                <div className="group relative h-full min-h-[260px] overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-ink-900/5 lg:min-h-[320px]">
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
                  <div className="absolute bottom-0 left-0 p-6 text-cream-50">
                    <p className="text-[11px] uppercase tracking-widest text-cream-50/70">
                      {img.location}
                    </p>
                    <p className="mt-1 max-w-xs font-serif text-lg leading-snug">
                      {img.alt.split(" — ")[1]}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
