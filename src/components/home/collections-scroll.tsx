import { Link } from "@tanstack/react-router";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import maldives from "@/assets/collection-maldives.jpg";
import amalfi from "@/assets/collection-amalfi.jpg";
import desert from "@/assets/collection-desert.jpg";
import type { PackageCategory } from "@/types/api";

const COLLECTIONS: Array<{
  category: PackageCategory;
  title: string;
  place: string;
  img: string;
  n: string;
}> = [
  { category: "BEACH", title: "Azure Serenity", place: "Maldives", img: maldives, n: "01" },
  { category: "HERITAGE", title: "Amalfi Drift", place: "Positano", img: amalfi, n: "02" },
  { category: "ADVENTURE", title: "Desert Monolith", place: "Utah", img: desert, n: "03" },
  { category: "HONEYMOON", title: "Kyoto Stillness", place: "Arashiyama", img: maldives, n: "04" },
  { category: "MOUNTAIN", title: "Alpine Peak", place: "St. Moritz", img: desert, n: "05" },
  { category: "PILGRIMAGE", title: "Sacred Passage", place: "Varanasi", img: amalfi, n: "06" },
];

export function CollectionsScroll() {
  return (
    <section className="py-24">
      <Container className="mb-10 flex items-end justify-between">
        <FadeUp>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            Browse by intent
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium text-ink-900">
            Signature collections
          </h2>
        </FadeUp>
      </Container>
      <div className="no-scrollbar overflow-x-auto">
        <div className="mx-auto flex w-max gap-6 px-6 pb-6 lg:px-10">
          {COLLECTIONS.map((c, i) => (
            <Link
              key={c.title}
              to="/packages"
              search={{ category: c.category } as never}
              className="group relative block w-72 shrink-0 overflow-hidden rounded-3xl bg-cream-100 ring-1 ring-black/5"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={c.img}
                alt={c.title}
                loading={i > 1 ? "lazy" : undefined}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-6">
                <span className="text-[10px] uppercase tracking-[0.2em] text-cream-50/80">
                  {c.n} · {c.place}
                </span>
                <div>
                  <h3 className="font-serif text-3xl italic text-cream-50">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-cream-50/70">
                    Explore collection
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}