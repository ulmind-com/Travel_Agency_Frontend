import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Container } from "@/components/layout/container";
import { recentGalleryQuery } from "@/lib/queries";
import {
  defaultRecentGallery,
  type RecentGalleryContent,
} from "@/services/recent-gallery.service";

function useContent(): RecentGalleryContent {
  const { data } = useSuspenseQuery(recentGalleryQuery());
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => force((n) => n + 1);
    window.addEventListener("ulmind:recent-gallery-changed", sync);
    return () =>
      window.removeEventListener("ulmind:recent-gallery-changed", sync);
  }, []);
  return data ?? defaultRecentGallery;
}

type TileProps = {
  src: string;
  alt: string;
  index: number;
  className?: string;
};

function Tile({ src, alt, index, className }: TileProps) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.9,
        delay: index * 0.14,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className={
        "group relative overflow-hidden rounded-[28px] bg-cream-100 ring-1 ring-ink-900/8 shadow-[0_30px_70px_-35px_rgba(28,25,23,0.45)] transition-shadow duration-500 hover:shadow-[0_45px_90px_-30px_rgba(28,25,23,0.5)] " +
        (className ?? "")
      }
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[11px] uppercase tracking-widest text-ink-900/30">
          Gallery image
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
    </motion.figure>
  );
}

export function RecentGallery() {
  const content = useContent();
  const s = content.slots;

  return (
    <section className="relative overflow-hidden bg-cream-50 py-24 lg:py-32">
      {/* decorative side accents */}
      <svg
        aria-hidden
        viewBox="0 0 60 60"
        className="pointer-events-none absolute left-6 top-1/2 hidden size-14 -translate-y-1/2 text-ink-900/25 lg:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M4 40 C 14 22, 30 22, 40 30 L 52 22 L 48 34 L 56 40" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="42" r="2" />
        <circle cx="34" cy="34" r="2" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 60 60"
        className="pointer-events-none absolute right-6 top-1/2 hidden size-14 -translate-y-1/2 text-ink-900/25 lg:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M56 40 C 46 22, 30 22, 20 30 L 8 22 L 12 34 L 4 40" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="42" r="2" />
        <circle cx="26" cy="34" r="2" />
      </svg>

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-script text-2xl text-ink-900/70 sm:text-3xl"
          >
            {content.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 font-serif text-5xl font-semibold tracking-tight text-ink-900 sm:text-6xl lg:text-7xl"
          >
            {content.title}
          </motion.h2>
        </div>

        {/* Collage — mirrors reference layout */}
        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-8">
            {/* Column 1 */}
            <div className="flex flex-col gap-6 md:gap-8">
              {s[0] && (
                <Tile src={s[0].imageUrl} alt={s[0].alt} index={0} className="aspect-square" />
              )}
              {s[3] && (
                <Tile src={s[3].imageUrl} alt={s[3].alt} index={3} className="aspect-square" />
              )}
            </div>
            {/* Column 2 — center, offset */}
            <div className="flex items-center justify-center md:translate-y-8">
              {s[1] && (
                <Tile
                  src={s[1].imageUrl}
                  alt={s[1].alt}
                  index={1}
                  className="aspect-[4/3] w-full"
                />
              )}
            </div>
            {/* Column 3 */}
            <div className="flex flex-col gap-6 md:gap-8">
              {s[2] && (
                <Tile src={s[2].imageUrl} alt={s[2].alt} index={2} className="aspect-square" />
              )}
              {s[4] && (
                <Tile src={s[4].imageUrl} alt={s[4].alt} index={4} className="aspect-square" />
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* bottom-right circular accent */}
      <div className="pointer-events-none absolute bottom-8 right-8 hidden size-10 items-center justify-center rounded-full border border-ink-900/25 text-ink-900/50 lg:flex">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}