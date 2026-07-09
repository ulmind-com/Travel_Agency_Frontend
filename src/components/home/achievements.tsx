import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Container } from "@/components/layout/container";
import { achievementsQuery } from "@/lib/queries";
import { defaultAchievements, type AchievementStat } from "@/services/achievements.service";

export function Achievements() {
  const { data } = useQuery(achievementsQuery());
  const content = data ?? defaultAchievements;

  return (
    <section className="relative overflow-hidden bg-cream-50 py-24 lg:py-32">
      {/* decorative doodles */}
      <DecorAccents />

      <Container className="relative">
        {(content.eyebrow || content.title) && (
          <div className="mb-16 text-center">
            {content.eyebrow && (
              <p className="mb-3 font-serif text-lg italic text-ink-900/60">
                {content.eyebrow}
              </p>
            )}
            {content.title && (
              <h2 className="font-serif text-4xl text-ink-900 lg:text-6xl">
                {content.title}
              </h2>
            )}
          </div>
        )}

        <div className="relative mx-auto max-w-6xl">
          {/* curved SVG path */}
          <svg
            viewBox="0 0 1200 500"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <motion.path
              d="M 20 380 Q 200 380 300 320 T 600 160 T 900 320 T 1180 120"
              fill="none"
              stroke="hsl(210 90% 56% / 0.25)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          <div className="relative grid grid-cols-2 gap-y-16 md:grid-cols-4 md:gap-x-6">
            {content.stats.map((s, i) => (
              <div
                key={s.id}
                className={
                  i === 1
                    ? "md:-translate-y-16"
                    : i === 3
                      ? "md:-translate-y-16"
                      : "md:translate-y-16"
                }
              >
                <StatCircle stat={s} index={i} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function StatCircle({ stat, index }: { stat: AchievementStat; index: number }) {
  const [hovered, setHovered] = useState(false);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // parse numeric portion for count-up
  const match = stat.value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]!) : 0;
  const suffix = match ? match[2] : stat.value;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.9,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative mx-auto aspect-square w-[190px] sm:w-[220px] lg:w-[260px]"
    >
      {/* circle */}
      <motion.div
        animate={
          hovered
            ? { boxShadow: "0 20px 50px -20px hsl(210 90% 56% / 0.45)" }
            : { boxShadow: "0 8px 30px -20px hsl(210 90% 56% / 0.2)" }
        }
        transition={{ duration: 0.5 }}
        className="absolute inset-0 rounded-full border border-[hsl(210_90%_56%_/_0.35)] bg-[hsl(210_90%_96%_/_0.65)] backdrop-blur-sm transition-colors group-hover:border-[hsl(210_90%_56%_/_0.7)]"
      />

      {/* orbiting blue dot */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: hovered ? 1.8 : 9,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            // start angle offset per circle
            rotate: index * 45,
          }}
        >
          <motion.span
            animate={
              hovered
                ? { opacity: [1, 0.35, 1], scale: [1, 1.4, 1] }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: 0.9,
              repeat: hovered ? Infinity : 0,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-0 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(210_90%_56%)] shadow-[0_0_0_4px_hsl(210_90%_56%_/_0.2),0_0_20px_hsl(210_90%_56%_/_0.7)]"
          />
        </motion.div>
      )}

      {/* content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <CountUp target={target} suffix={suffix} raw={stat.value} reduced={reduced} />
        <p className="mt-2 text-sm text-ink-900/70 lg:text-base">{stat.label}</p>
      </div>
    </motion.div>
  );
}

function CountUp({
  target,
  suffix,
  raw,
  reduced,
}: {
  target: number;
  suffix: string;
  raw: string;
  reduced: boolean;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || started) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e && e.isIntersecting) {
          setStarted(true);
          if (!reduced) {
            const controls = animate(mv, target, {
              duration: 1.6,
              ease: [0.22, 1, 0.36, 1],
            });
            return () => controls.stop();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [mv, target, started, reduced]);

  if (reduced || !target) {
    return (
      <div ref={ref} className="font-serif text-4xl font-semibold text-ink-900 lg:text-5xl">
        {raw}
      </div>
    );
  }

  return (
    <div ref={ref} className="flex items-baseline font-serif text-4xl font-semibold text-ink-900 lg:text-5xl">
      <motion.span>{rounded}</motion.span>
      <span>{suffix}</span>
    </div>
  );
}

function DecorAccents() {
  return (
    <>
      <svg
        aria-hidden
        className="pointer-events-none absolute left-6 top-8 h-16 w-16 text-[hsl(210_90%_56%)] opacity-40"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M8 40c4-2 10-3 18-3s16 2 22 5" strokeLinecap="round" />
        <ellipse cx="22" cy="38" rx="10" ry="5" />
        <circle cx="17" cy="42" r="2" fill="currentColor" />
        <circle cx="29" cy="42" r="2" fill="currentColor" />
      </svg>

      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-4 left-2 h-40 w-40 opacity-70"
        viewBox="0 0 160 160"
        fill="none"
      >
        <g stroke="hsl(150 40% 40%)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M60 130 Q 55 100 62 70" />
          <path d="M62 70 Q 40 60 30 55" />
          <path d="M62 70 Q 85 55 95 50" />
          <path d="M62 70 Q 45 50 40 40" />
          <path d="M62 70 Q 80 48 90 38" />
        </g>
        <ellipse cx="60" cy="140" rx="30" ry="5" fill="hsl(150 30% 60% / 0.3)" />
        {/* balloon */}
        <circle cx="30" cy="90" r="12" stroke="hsl(210 90% 56%)" strokeWidth="1.5" fill="hsl(210 90% 96%)" />
        <path d="M22 100 L30 115 L38 100" stroke="hsl(210 90% 56%)" strokeWidth="1" fill="none" />
        <rect x="27" y="115" width="6" height="4" fill="hsl(210 90% 56%)" opacity="0.5" />
      </svg>

      <div className="pointer-events-none absolute bottom-8 right-8 grid size-12 place-items-center rounded-full border border-[hsl(210_90%_56%_/_0.4)] text-[hsl(210_90%_56%)] opacity-70">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </div>
    </>
  );
}