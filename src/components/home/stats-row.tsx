import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";

const STATS = [
  { n: "14", copy: "Curated sanctuaries across five continents" },
  { n: "24/7", copy: "Dedicated private concierge at your disposal" },
  { n: "100%", copy: "Carbon-neutral itinerary orchestration" },
  { n: "08", copy: "Years of crafting invisible service" },
];

export function StatsRow() {
  return (
    <section className="border-b border-ink-900/5 bg-cream-100 py-16 sm:py-24">
      <Container>
        <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-4">
          {STATS.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.08}>
              <span className="block font-serif text-4xl font-medium text-ink-900 sm:text-5xl">
                {s.n}
              </span>
              <p className="mt-2 max-w-[20ch] text-xs text-ink-900/60 sm:text-sm">
                {s.copy}
              </p>
            </FadeUp>
          ))}
        </div>
      </Container>
    </section>
  );
}