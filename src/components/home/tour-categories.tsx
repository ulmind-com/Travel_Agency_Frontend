import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { tourCategoriesQuery } from "@/lib/queries";
import {
  defaultTourCategories,
  type TourCategory,
} from "@/services/tour-categories.service";

const AUTO_MS = 3200;
const TILTS = [-6, 4, -3, 5, -4];
const LIFTS = [10, -6, 8, -8, 6];

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

function useViewportSize() {
  const [n, setN] = useState(5);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const w = window.innerWidth;
      setN(w < 640 ? 2 : w < 900 ? 3 : w < 1200 ? 4 : 5);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return n;
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
  const visible = useViewportSize();
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || paused || total <= 1) return;
    const t = window.setTimeout(() => setStart((s) => (s + 1) % total), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [start, paused, reduced, total]);

  const window_ = Array.from(
    { length: visible },
    (_, i) => items[(start + i) % total]!,
  );

  return (
    <section className="bg-cream-50 py-24">
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

      <div
        className="relative mt-16 [perspective:1400px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const s = touchX.current;
          if (s == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? s) - s;
          if (Math.abs(dx) > 40) {
            setStart((v) =>
              dx < 0 ? (v + 1) % total : (v - 1 + total) % total,
            );
          }
          touchX.current = null;
        }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-6 px-6 lg:gap-10 lg:px-10">
          {window_.map((item, i) => (
            <TiltCard
              key={item.id + ":" + start + ":" + i}
              item={item}
              tilt={TILTS[i % TILTS.length]!}
              lift={LIFTS[i % LIFTS.length]!}
              index={i}
              total={visible}
            />
          ))}
        </div>

        <div className="mt-14 flex justify-center gap-3">
          {Array.from({ length: total }).map((_, i) => {
            const active = i === start;
            return (
              <button
                key={i}
                type="button"
                aria-label={"Go to slide " + (i + 1)}
                onClick={() => setStart(i)}
                className={
                  "size-3 rounded-full border transition-colors " +
                  (active
                    ? "border-ink-900 bg-ink-900"
                    : "border-ink-900/30 bg-transparent hover:bg-ink-900/10")
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TiltCard({
  item,
  tilt,
  lift,
  index,
  total,
}: {
  item: TourCategory;
  tilt: number;
  lift: number;
  index: number;
  total: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80, rotateY: -18, rotateZ: 0 }}
      animate={{ opacity: 1, x: 0, rotateY: 0, rotateZ: tilt, y: lift }}
      exit={{ opacity: 0, x: -80, rotateY: 18 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: (index / Math.max(total, 1)) * 0.15,
      }}
      whileHover={{ rotateZ: 0, y: lift - 16, scale: 1.04 }}
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