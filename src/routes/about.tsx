import { createFileRoute } from "@tanstack/react-router";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import portrait from "@/assets/testimonial-portrait.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The Journal · Ulmind Travel" },
      {
        name: "description",
        content:
          "The Ulmind story — a boutique travel practice shaped by quiet, craft, and a deep respect for place.",
      },
      { property: "og:title", content: "The Journal · Ulmind Travel" },
      {
        property: "og:description",
        content: "A boutique travel practice shaped by quiet, craft, and a deep respect for place.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="pt-24">
      <Container className="py-16 lg:py-24">
        <FadeUp className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            The practice
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-ink-900 md:text-6xl">
            We compose journeys the way a chef composes a tasting menu.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-900/70">
            Ulmind Travel is a small studio of concierges, designers, and
            hoteliers. Every escape is drafted for a single guest — never a
            template — with a bias toward stillness, craft, and place.
          </p>
        </FadeUp>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          <FadeUp>
            <img
              src={portrait}
              alt="A traveler at golden hour"
              className="w-full rounded-3xl object-cover"
              loading="lazy"
              style={{ aspectRatio: "4/5" }}
            />
          </FadeUp>
          <FadeUp delay={0.1} className="space-y-8">
            {[
              { n: "01", t: "Quiet by design", d: "No mass groups, no bus tours, no rushed check-ins. Small, intentional, and slow." },
              { n: "02", t: "Craft first", d: "We work only with hoteliers and guides who treat their work as a practice." },
              { n: "03", t: "Respect for place", d: "Carbon-neutral itineraries and revenue that returns to local communities." },
            ].map((it) => (
              <div key={it.n} className="border-t border-ink-900/10 pt-6">
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">{it.n}</p>
                <p className="mt-3 font-serif text-3xl text-ink-900">{it.t}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-900/60">{it.d}</p>
              </div>
            ))}
          </FadeUp>
        </div>
      </Container>
    </div>
  );
}