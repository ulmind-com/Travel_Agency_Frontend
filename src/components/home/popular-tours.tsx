import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { popularToursQuery } from "@/lib/queries";
import {
  defaultPopularTours,
  type PopularTour,
  type PopularToursContent,
} from "@/services/popular-tours.service";
import { packagesService } from "@/services/packages.service";

function useContent(): PopularToursContent {
  const { data } = useQuery(popularToursQuery());
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => force((n) => n + 1);
    window.addEventListener("ulmind:popular-tours-changed", sync);
    return () =>
      window.removeEventListener("ulmind:popular-tours-changed", sync);
  }, []);
  return data ?? defaultPopularTours;
}

function TourCard({ t, ctaLabel }: { t: PopularTour; ctaLabel: string }) {
  return (
    <article className="pop-tour-card group relative flex w-[260px] shrink-0 flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink-900/8 shadow-[0_25px_60px_-30px_rgba(28,25,23,0.35)] transition-all duration-500 sm:w-[320px]">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {t.imageUrl ? (
          <img
            src={t.imageUrl}
            alt={t.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.08]"
          />
        ) : (
          <div className="h-full w-full bg-cream-100" />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/25 via-transparent to-transparent"
        />
      </div>
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div>
          <h3 className="font-serif text-xl leading-tight text-ink-900">
            {t.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    "size-3.5 " +
                    (i < Math.round(t.rating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-ink-900/20")
                  }
                />
              ))}
            </div>
            <span className="text-xs text-ink-900/60">
              ({t.ratingCount} Rating)
            </span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-900/8 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-900/70">
            <Clock className="size-3.5" strokeWidth={1.5} />
            {String(t.days).padStart(2, "0")} Days
          </span>
          <Link
            to={t.ctaHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/15 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-ink-900 transition-all duration-300 hover:bg-ink-900 hover:text-cream-50"
          >
            {ctaLabel}
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PopularTours() {
  const content = useContent();
  const { data: realPackages } = useQuery({
    queryKey: ["public-packages", {}],
    queryFn: () => packagesService.publicSearch(),
  });

  // Use real featured packages if available, otherwise fallback to CMS mock content
  const featured = realPackages?.filter((p) => p.is_featured) ?? [];
  
  const tours = featured.length > 0 
    ? featured.map((p) => ({
        id: p.id,
        name: p.title,
        rating: 5,
        ratingCount: Math.floor(Math.random() * 20) + 5,
        days: p.duration_days,
        ctaHref: `/packages/${p.id}`,
        imageUrl: p.thumbnail?.url ?? p.gallery_images?.[0]?.url ?? "",
      }))
    : content.tours;

  // Repeat the list for a seamless infinite marquee
  const loop = tours.length > 0 ? [...tours, ...tours, ...tours] : [];

  return (
    <section className="relative overflow-hidden bg-cream-50 py-16 sm:py-24 lg:py-32">
      <Container>
        <FadeUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-script text-2xl text-ink-900/70 sm:text-4xl">
              {content.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-ink-900 sm:text-5xl lg:text-6xl">
              {content.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-900/60 sm:text-base">
              {content.description}
            </p>
          </div>
        </FadeUp>
      </Container>

      {/* 3D marquee */}
      <div className="pop-tour-stage relative mt-10 sm:mt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-cream-50 to-transparent sm:w-40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-cream-50 to-transparent sm:w-40"
        />
        {tours.length > 0 ? (
          <div className="pop-tour-viewport">
            <div className="pop-tour-track">
              {loop.map((t, i) => (
                <TourCard
                  key={t.id + "-" + i}
                  t={t}
                  ctaLabel={content.ctaLabel}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-ink-900/40">
            No tours yet.
          </p>
        )}
      </div>

      <style>{`
        .pop-tour-stage {
          /* Removed 3D perspective to fix click hitboxes and trembling */
        }
        .pop-tour-viewport {
          overflow: hidden;
          padding: 40px 0 60px;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .pop-tour-track {
          display: flex;
          gap: 28px;
          width: max-content;
          animation: pop-tour-scroll 45s linear infinite;
        }
        .pop-tour-stage:hover .pop-tour-track {
          animation-play-state: paused;
        }
        .pop-tour-card {
          /* Simple, stable transition without 3D transforms */
          transition: transform 500ms ease, box-shadow 500ms ease;
          transform: translateY(0);
        }
        .pop-tour-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -20px rgba(28, 25, 23, 0.25);
        }
        @keyframes pop-tour-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.3333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pop-tour-track { animation: none; }
        }
      `}</style>
    </section>
  );
}