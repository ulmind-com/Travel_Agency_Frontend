import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { tourCategoriesQuery } from "@/lib/queries";
import {
  defaultTourCategories,
  type TourCategory,
} from "@/services/tour-categories.service";

// Continuous left-drift speed in px/second.
const SPEED = 55;
const TILTS = [-6, 4, -3, 5, -4, 3, -5];
const LIFTS = [10, -6, 8, -8, 6, -10, 4];

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

function useTourCategories(): TourCategory[] {
  const { data } = useSuspenseQuery(tourCategoriesQuery());
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => force((n) => n + 1);
    window.addEventListener("ulmind:tour-categories-changed", sync);
    return () => window.removeEventListener("ulmind:tour-categories-changed", sync);
  }, []);
  return data && data.length > 0 ? data : defaultTourCategories;
}

export function TourCategories() {
  const items = useTourCategories();
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);

  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);
  const lastT = useRef<number | null>(null);

  // Measure one copy of the track (we render the list twice for a seamless loop).
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      halfWidthRef.current = el.scrollWidth / 2;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items.length]);

  useAnimationFrame((t) => {
    if (reduced || paused) {
      lastT.current = t;
      return;
    }
    const prev = lastT.current ?? t;
    const dt = (t - prev) / 1000;
    lastT.current = t;
    const half = halfWidthRef.current;
    if (!half) return;
    let next = x.get() - SPEED * dt;
    // Wrap: after we've scrolled one full copy, snap back so the second copy takes over invisibly.
    if (next <= -half) next += half;
    x.set(next);
  });

  // Render items twice so the loop is seamless.
  const loop = [...items, ...items];

  return (
    <section
      className="overflow-hidden bg-cream-50 py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Container className="text-center">
        <FadeUp>
          <p className="font-serif text-3xl italic text-ink-900/80 sm:text-4xl">
            Wonderful Place For You
          </p>
          <h2 className="mt-3 font-serif text-5xl font-medium text-ink-900 sm:text-6xl">
            Tour Categories
          </h2>
        </FadeUp>
      </Container>

      <div className="relative mt-16 [perspective:1400px]">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-cream-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-cream-50 to-transparent" />

        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max items-center gap-8 px-6 will-change-transform lg:gap-12 lg:px-10"
        >
          {loop.map((item, i) => (
            <TiltCard
              key={item.id + ":" + i}
              item={item}
              tilt={TILTS[i % TILTS.length]!}
              lift={LIFTS[i % LIFTS.length]!}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TiltCard({
  item,
  tilt,
  lift,
}: {
  item: TourCategory;
  tilt: number;
  lift: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateZ: tilt }}
      whileInView={{ opacity: 1, y: lift, rotateZ: tilt }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ rotateZ: 0, y: lift - 18, scale: 1.05 }}
      className="group flex w-40 shrink-0 flex-col items-center [transform-style:preserve-3d] sm:w-52 lg:w-60"
      style={{ transformOrigin: "center bottom" }}
    >
      <Link
        to="/packages"
        search={{ category: item.category } as never}
        className="block w-full overflow-hidden rounded-3xl bg-cream-100 shadow-[0_25px_60px_-20px_rgba(28,25,23,0.35)] ring-1 ring-black/5"
        style={{ aspectRatio: "1/1" }}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </Link>
      <div className="mt-6 text-center">
        <h3 className="font-serif text-xl font-medium text-ink-900 sm:text-2xl">
          {item.name}
        </h3>
        <Link
          to="/packages"
          search={{ category: item.category } as never}
          className="mt-1 inline-block text-xs uppercase tracking-widest text-ink-900/50 hover:text-ink-900"
        >
          See More
        </Link>
      </div>
    </motion.div>
  );
}