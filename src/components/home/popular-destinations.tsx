import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { popularDestinationsQuery } from "@/lib/queries";
import {
  defaultPopularDestinations,
  type PopularDestination,
} from "@/services/popular-destinations.service";

const AUTO_MS = 3500;

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

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setM(window.innerWidth < 640);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return m;
}

function useDestinations(): PopularDestination[] {
  const { data } = useSuspenseQuery(popularDestinationsQuery());
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => force((n) => n + 1);
    window.addEventListener("ulmind:popular-destinations-changed", sync);
    return () =>
      window.removeEventListener("ulmind:popular-destinations-changed", sync);
  }, []);
  return data && data.length > 0 ? data : defaultPopularDestinations;
}

// Shortest signed distance from `i` to `active` on a ring of length `n`.
function ringOffset(i: number, active: number, n: number) {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

export function PopularDestinations() {
  const items = useDestinations();
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const total = items.length;

  useEffect(() => {
    if (reduced || paused || total <= 1) return;
    const t = window.setTimeout(
      () => setActive((v) => (v + 1) % total),
      AUTO_MS,
    );
    return () => window.clearTimeout(t);
  }, [active, paused, reduced, total]);

  const next = () => setActive((v) => (v + 1) % total);
  const prev = () => setActive((v) => (v - 1 + total) % total);

  return (
    <section className="bg-cream-50 py-24">
      <Container className="text-center">
        <FadeUp>
          <p className="font-serif text-3xl italic text-ink-900/80 sm:text-4xl">
            Top Destination
          </p>
          <h2 className="mt-3 font-serif text-5xl font-medium text-ink-900 sm:text-6xl">
            Popular Destination
          </h2>
        </FadeUp>
      </Container>

      <div
        className="relative mt-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const s = touchX.current;
          if (s == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? s) - s;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
          touchX.current = null;
        }}
      >
        <div
          className="relative mx-auto flex h-[580px] max-w-6xl items-center justify-center sm:h-[640px]"
          style={{ perspective: "1400px" }}
        >
          {items.map((d, i) => {
            const off = ringOffset(i, active, total);
            const abs = Math.abs(off);
            const sign = Math.sign(off);
            // depth styling
            const xPx = isMobile
              ? sign * abs * 90
              : sign * (abs === 1 ? 240 : abs === 2 ? 410 : 560);
            const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : abs === 2 ? 0.66 : 0.5;
            const rotY = reduced ? 0 : -sign * (abs === 0 ? 0 : abs === 1 ? 22 : 32);
            const blur = abs === 0 ? 0 : abs === 1 ? 2 : 5;
            const opacity = abs >= 3 ? 0 : abs === 0 ? 1 : abs === 1 ? 0.85 : 0.55;
            const z = 100 - abs * 20;
            const isActive = abs === 0;

            return (
              <motion.button
                key={d.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={"Focus " + d.name}
                initial={false}
                animate={{
                  x: xPx,
                  scale,
                  rotateY: rotY,
                  opacity,
                  filter: "blur(" + blur + "px)",
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  zIndex: z,
                  transformStyle: "preserve-3d",
                  pointerEvents: abs >= 3 ? "none" : "auto",
                }}
                className="absolute h-[540px] w-[340px] overflow-hidden rounded-3xl shadow-[0_40px_80px_-30px_rgba(28,25,23,0.55)] ring-1 ring-black/10 sm:h-[600px] sm:w-[390px]"
              >
                <img
                  src={d.imageUrl}
                  alt={d.name}
                  loading="lazy"
                  width={768}
                  height={1024}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                  <div className="text-left">
                    <h3 className="font-serif text-3xl font-medium text-cream-50">
                      {d.name}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-widest text-cream-50/80">
                      {d.listingCount} Listing{d.listingCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link
                      to="/packages"
                      className="inline-flex items-center gap-2 rounded-full border border-cream-50/60 bg-ink-900/40 px-5 py-2 text-xs uppercase tracking-widest text-cream-50 backdrop-blur-md transition-colors hover:bg-cream-50/20"
                    >
                      Details <ArrowRight className="size-3.5" />
                    </Link>
                  </motion.span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous destination"
            className="grid size-14 place-items-center rounded-full border border-ink-900/20 text-ink-900 transition-colors hover:bg-ink-900/5"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next destination"
            className="grid size-14 place-items-center rounded-full border border-ink-900/20 text-ink-900 transition-colors hover:bg-ink-900/5"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}