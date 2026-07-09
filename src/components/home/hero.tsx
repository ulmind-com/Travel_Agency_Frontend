import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LetterReveal } from "@/components/motion/letter-reveal";
import { heroSlidesQuery } from "@/lib/queries";
import { defaultHeroSlides, type HeroSlide } from "@/services/hero-slides.service";

const SLIDE_DURATION_MS = 6500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useHeroSlides(): HeroSlide[] {
  const { data } = useSuspenseQuery(heroSlidesQuery());
  // Re-sync when admin edits localStorage.
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => force((n) => n + 1);
    window.addEventListener("ulmind:hero-slides-changed", sync);
    return () => window.removeEventListener("ulmind:hero-slides-changed", sync);
  }, []);
  return data && data.length > 0 ? data : defaultHeroSlides;
}

export function Hero() {
  const slides = useHeroSlides();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = slides.length;
  const active = slides[index] ?? slides[0];

  const go = useCallback(
    (next: number) => setIndex(((next % total) + total) % total),
    [total],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Preload the next slide so the crossfade never flashes.
  useEffect(() => {
    const upcoming = slides[(index + 1) % total];
    if (!upcoming) return;
    const img = new Image();
    img.src = upcoming.imageUrl;
  }, [index, slides, total]);

  // Autoplay
  useEffect(() => {
    if (reduced || focused || total <= 1) return;
    const t = window.setTimeout(next, SLIDE_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [next, focused, reduced, index, total]);

  return (
    <section
      className="relative h-screen min-h-screen w-full overflow-hidden bg-ink-900"
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        if (start == null) return;
        const end = e.changedTouches[0]?.clientX ?? start;
        const dx = end - start;
        if (Math.abs(dx) > 48) (dx < 0 ? next : prev)();
        touchStartX.current = null;
      }}
    >
      {/* Background image layer */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id + ":bg"}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={active.imageUrl}
            alt={active.headlinePrefix + " " + active.headlineAccent}
            className="h-full w-full object-cover"
            width={1920}
            height={1200}
            fetchPriority={index === 0 ? "high" : "auto"}
            initial={{ scale: reduced ? 1 : 1.08 }}
            animate={{ scale: reduced ? 1 : 1.16 }}
            transition={{ duration: reduced ? 0 : 8, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/15 to-ink-900/70" />
        </motion.div>
      </AnimatePresence>

      {/* Text layer */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-16 pt-24 lg:px-10 lg:pb-24">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id + ":text"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/90">
                {active.eyebrow}
              </p>
              <h1
                aria-live="polite"
                className="font-serif text-5xl leading-[1.02] tracking-tight text-cream-50 sm:text-6xl lg:text-8xl"
              >
                <LetterReveal text={active.headlinePrefix} />
                <br />
                <span className="italic">
                  <LetterReveal text={active.headlineAccent} delay={0.35} />
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-cream-50/85">
                {active.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          <SearchCard />

          <div className="mt-8 flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-widest text-cream-50/70">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 border-b border-cream-50/40 pb-1 text-cream-50 transition-colors hover:border-cream-50"
            >
              Browse the portfolio <ArrowRight className="size-3" />
            </Link>
            <span className="opacity-50">·</span>
            <span>Private concierge · 24/7</span>
          </div>
        </div>
      </div>

      {/* Progress rail (right) */}
      <div className="pointer-events-none absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 lg:right-10 lg:flex">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={"Go to slide " + (i + 1)}
            aria-current={i === index}
            onClick={() => go(i)}
            className="pointer-events-auto group relative h-14 w-[2px] overflow-hidden bg-cream-50/25"
          >
            <motion.span
              key={i === index ? active.id : "idle-" + s.id}
              className="absolute inset-x-0 top-0 origin-top bg-cream-50"
              initial={{ scaleY: i < index ? 1 : 0 }}
              animate={{
                scaleY: i < index ? 1 : i === index ? 1 : 0,
              }}
              transition={
                i === index && !focused && !reduced
                  ? { duration: SLIDE_DURATION_MS / 1000, ease: "linear" }
                  : { duration: 0.3 }
              }
              style={{ height: "100%" }}
            />
          </button>
        ))}
      </div>

      {/* Prev/Next + counter */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 lg:bottom-10 lg:right-10">
        <span className="hidden font-serif text-sm text-cream-50/70 tabular-nums sm:inline">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-2 opacity-40">/</span>
          {String(total).padStart(2, "0")}
        </span>
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prev}
          className="grid size-10 place-items-center rounded-full border border-cream-50/30 text-cream-50 backdrop-blur-md transition-colors hover:bg-cream-50/10"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={next}
          className="grid size-10 place-items-center rounded-full border border-cream-50/30 text-cream-50 backdrop-blur-md transition-colors hover:bg-cream-50/10"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function SearchCard() {
  return (
    <div className="relative mt-10">
      {/* Soft ambient glow behind the glass */}
      <div className="absolute -inset-4 rounded-[3rem] bg-gold/10 blur-3xl" />

      {/* Decorative liquid highlight along the top edge */}
      <div className="pointer-events-none absolute top-0 left-1/2 z-10 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-cream-50/20 to-transparent" />

      <form
        action="/packages"
        method="get"
        className="relative flex flex-col items-stretch gap-0 rounded-2xl border border-cream-50/10 bg-cream-50/5 p-2 shadow-2xl ring-1 ring-inset ring-cream-50/5 backdrop-blur-2xl md:flex-row md:rounded-full"
      >
        <FieldGroup icon={<MapPin className="size-3.5" />} label="Where" name="destination" placeholder="Any destination" />
        <FieldGroup icon={<Calendar className="size-3.5" />} label="When" name="when" placeholder="Add dates" type="text" />
        <FieldGroup icon={<Users className="size-3.5" />} label="Guests" name="guests" placeholder="2 adults" />
        <button
          type="submit"
          className="group relative flex h-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-ink-900 px-8 py-4 text-[12px] font-medium uppercase tracking-widest text-cream-50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98] md:rounded-full md:py-0"
        >
          {/* Subtle inner polish */}
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-cream-50/10 to-transparent opacity-50" />
          {/* Hairline metallic gold border */}
          <div className="absolute inset-0 rounded-[inherit] border border-gold/30 transition-colors duration-500 group-hover:border-gold/60" />
          {/* Hover sheen */}
          <div className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-cream-50/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <span className="relative">Find sanctuary</span>
          <ArrowRight className="relative size-4 text-gold transition-transform duration-500 group-hover:translate-x-1" />
        </button>
      </form>
    </div>
  );
}

function FieldGroup({
  icon,
  label,
  name,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="group flex flex-1 flex-col justify-center border-b border-cream-50/10 px-6 py-4 transition-colors hover:bg-cream-50/[0.03] last:border-b-0 md:border-b-0 md:border-r md:px-8 md:last:border-r-0">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-cream-50/40">
        {icon} {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full border-none bg-transparent p-0 text-base font-light text-cream-50 placeholder:text-cream-50/30 focus:outline-none focus:ring-0"
      />
    </label>
  );
}
