import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, UserRound } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { planYourTripQuery } from "@/lib/queries";
import {
  defaultPlanYourTrip,
  type PlanYourTripContent,
} from "@/services/plan-your-trip.service";

function useContent(): PlanYourTripContent {
  const { data } = useSuspenseQuery(planYourTripQuery());
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => force((n) => n + 1);
    window.addEventListener("ulmind:plan-your-trip-changed", sync);
    return () =>
      window.removeEventListener("ulmind:plan-your-trip-changed", sync);
  }, []);
  return data ?? defaultPlanYourTrip;
}

export const PLAN_SHAPES = {
  archTall: {
    aspect: "aspect-[1/2]",
    clipId: "plan-trip-arch-tall",
  },
  dRight: {
    aspect: "aspect-square",
    clipId: "plan-trip-d-right",
  },
  archBottom: {
    aspect: "aspect-square",
    clipId: "plan-trip-arch-bottom",
  },
} as const;

export type PlanShapeKey = keyof typeof PLAN_SHAPES;

export function getPlanShapeClipStyle(shape: PlanShapeKey): CSSProperties {
  const clipPath = `url(#${PLAN_SHAPES[shape].clipId})`;
  return { clipPath, WebkitClipPath: clipPath };
}

export function PlanShapeClipDefs() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="pointer-events-none absolute"
    >
      <defs>
        <clipPath id="plan-trip-arch-tall" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0 C0.22,0 0,0.13 0,0.3 L0,0.78 C0,0.91 0.11,1 0.25,1 L1,1 L1,0.3 C1,0.13 0.78,0 0.5,0 Z" />
        </clipPath>
        <clipPath id="plan-trip-d-right" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.49 C0.03,0.22 0.24,0 0.52,0 C0.79,0 1,0.22 1,0.5 C1,0.78 0.78,1 0.5,1 Z" />
        </clipPath>
        <clipPath id="plan-trip-arch-bottom" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0 L1,0 L1,0.51 C0.97,0.78 0.76,1 0.48,1 C0.21,1 0,0.78 0,0.5 C0,0.22 0.22,0 0.5,0 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ShapePhoto({
  imageUrl,
  shape,
}: {
  imageUrl: string;
  shape: PlanShapeKey;
}) {
  const s = PLAN_SHAPES[shape];
  return (
    <div
      className={
        "relative w-full drop-shadow-[0_30px_35px_rgba(28,25,23,0.18)] " +
        s.aspect
      }
    >
      <div
        className="h-full w-full overflow-hidden bg-cream-100 ring-1 ring-ink-900/5"
        style={getPlanShapeClipStyle(shape)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}

const FEATURE_ICONS = [Compass, UserRound] as const;

export function PlanYourTrip() {
  const content = useContent();

  return (
    <section className="relative bg-cream-50 py-24 lg:py-32">
      <PlanShapeClipDefs />
      <Container>
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
          {/* Collage */}
          <div className="relative order-2 lg:order-1">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 top-10 hidden size-64 rounded-full bg-cream-100/80 blur-3xl lg:block"
            />

            <div className="relative mx-auto grid max-w-[620px] grid-cols-2 gap-4 sm:gap-5">
              <FadeUp>
                <ShapePhoto imageUrl={content.slots.arch} shape="archTall" />
              </FadeUp>

              <div className="flex flex-col gap-4 sm:gap-5">
                <FadeUp delay={0.08}>
                  <ShapePhoto imageUrl={content.slots.circleA} shape="dRight" />
                </FadeUp>
                <FadeUp delay={0.16}>
                  <ShapePhoto
                    imageUrl={content.slots.circleB}
                    shape="archBottom"
                  />
                </FadeUp>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <FadeUp>
              <p className="font-serif text-3xl italic text-ink-900/80 sm:text-4xl">
                {content.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
                {content.title}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-900/60 sm:text-lg">
                {content.description}
              </p>
            </FadeUp>

            <div className="mt-10 space-y-8">
              {content.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]!;
                return (
                  <FadeUp key={f.id} delay={0.05 * (i + 1)}>
                    <div className="flex items-start gap-5">
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-900 text-cream-50 shadow-[0_15px_30px_-15px_rgba(28,25,23,0.5)]">
                        <Icon className="size-6" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-2xl text-ink-900">
                          {f.title}
                        </h3>
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
                to={content.ctaHref}
                className="mt-12 inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 text-xs uppercase tracking-[0.25em] text-cream-50 transition-transform hover:-translate-y-0.5"
              >
                {content.ctaLabel}
                <ArrowRight className="size-4" />
              </Link>
            </FadeUp>
          </div>
        </div>
      </Container>
    </section>
  );
}