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
          <path d="M0.5,0 C0.22,0 0,0.13 0,0.31 L0,0.78 C0,0.92 0.11,1 0.26,1 L1,1 L1,0.31 C1,0.13 0.78,0 0.5,0 Z" />
        </clipPath>
        <clipPath id="plan-trip-d-right" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.49 C0,0.22 0.22,0 0.5,0 C0.78,0 1,0.22 1,0.5 C1,0.78 0.78,1 0.5,1 Z" />
        </clipPath>
        <clipPath id="plan-trip-arch-bottom" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0 L1,0 L1,0.5 C1,0.78 0.78,1 0.5,1 C0.22,1 0,0.78 0,0.5 C0,0.22 0.22,0 0.5,0 Z" />
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
    <section className="relative bg-cream-50 py-16 sm:py-24 lg:py-32">
      <PlanShapeClipDefs />
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
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
              <p className="font-script text-2xl text-ink-900/80 sm:text-4xl">
                {content.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
                {content.title}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-900/60 sm:text-base lg:text-lg">
                {content.description}
              </p>
            </FadeUp>

            <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
              {content.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]!;
                return (
                  <FadeUp key={f.id} delay={0.05 * (i + 1)}>
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-900 text-cream-50 shadow-[0_15px_30px_-15px_rgba(28,25,23,0.5)] sm:size-14">
                        <Icon className="size-5 sm:size-6" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-xl text-ink-900 sm:text-2xl">
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
                to="/about"
                className="mt-10 inline-flex items-center gap-3 rounded-full bg-ink-900 px-6 py-3.5 text-[11px] uppercase tracking-[0.25em] text-cream-50 transition-transform hover:-translate-y-0.5 sm:mt-12 sm:px-8 sm:py-4 sm:text-xs"
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