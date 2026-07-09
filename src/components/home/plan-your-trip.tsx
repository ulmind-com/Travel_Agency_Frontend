import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Compass, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { planYourTripQuery } from "@/lib/queries";
import {
  defaultPlanYourTrip,
  type PlanPhoto,
  type PlanYourTripContent,
} from "@/services/plan-your-trip.service";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

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

/**
 * A single collage image slot that flips through its photo list with a
 * subtle 3D Y-axis rotation. Slots with a single photo stay static.
 */
function PhotoSlot({
  photos,
  intervalMs,
  delayMs,
  paused,
  reduced,
  className,
}: {
  photos: PlanPhoto[];
  intervalMs: number;
  delayMs: number;
  paused: boolean;
  reduced: boolean;
  className: string;
}) {
  const valid = photos.filter((p) => p.imageUrl);
  const [idx, setIdx] = useState(0);
  const total = valid.length;

  useEffect(() => {
    if (paused || reduced || total <= 1) return;
    const start = window.setTimeout(() => {
      setIdx((v) => (v + 1) % total);
    }, delayMs);
    return () => window.clearTimeout(start);
  }, [delayMs, paused, reduced, total, idx]);

  useEffect(() => {
    if (paused || reduced || total <= 1) return;
    const t = window.setInterval(() => {
      setIdx((v) => (v + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs, paused, reduced, total]);

  const current = valid[idx] ?? valid[0];
  return (
    <div
      className={
        "relative overflow-hidden rounded-[50%] bg-cream-100 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.35)] ring-1 ring-ink-900/5 " +
        className
      }
      style={{ perspective: "1200px" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={current?.id ?? "empty"}
          src={current?.imageUrl}
          alt=""
          loading="lazy"
          initial={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.04, rotateY: 8 }
          }
          animate={
            reduced
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, rotateY: 0 }
          }
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.98, rotateY: -8 }
          }
          transition={{ duration: reduced ? 0.6 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        />
      </AnimatePresence>
    </div>
  );
}

const FEATURE_ICONS = [Compass, UserRound] as const;

export function PlanYourTrip() {
  const content = useContent();
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);

  return (
    <section className="bg-cream-50 py-24 lg:py-32">
      <Container>
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
          {/* Collage */}
          <div
            className="relative order-2 lg:order-1"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* soft cream disc for depth */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 top-10 hidden size-64 rounded-full bg-cream-100/80 blur-3xl lg:block"
            />

            <div className="relative mx-auto grid max-w-[560px] grid-cols-[1.05fr_0.95fr] gap-4 sm:gap-6">
              <FadeUp>
                <PhotoSlot
                  photos={content.slots.arch}
                  intervalMs={4600}
                  delayMs={0}
                  paused={paused}
                  reduced={reduced}
                  className="aspect-[3/5] w-full"
                />
              </FadeUp>

              <div className="flex flex-col gap-4 sm:gap-6">
                <FadeUp delay={0.08}>
                  <PhotoSlot
                    photos={content.slots.circleA}
                    intervalMs={4600}
                    delayMs={1200}
                    paused={paused}
                    reduced={reduced}
                    className="aspect-[5/6] w-full"
                  />
                </FadeUp>
                <FadeUp delay={0.16}>
                  <PhotoSlot
                    photos={content.slots.circleB}
                    intervalMs={4600}
                    delayMs={2400}
                    paused={paused}
                    reduced={reduced}
                    className="aspect-[5/6] w-full"
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