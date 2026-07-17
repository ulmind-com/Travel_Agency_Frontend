import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, MapPin, Users, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LetterReveal } from "@/components/motion/letter-reveal";
import { heroSlidesQuery } from "@/lib/queries";
import { defaultHeroSlides, type HeroSlide } from "@/services/hero-slides.service";

const SLIDE_DURATION_MS = 6500;
const AUDIO_FADE_DURATION = 800; // ms for fade-in/out

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let currentAudio: HTMLAudioElement | null = null;
let audioStopTimeout: number | null = null;

/** Whether the user has interacted with the page (unlocks autoplay). */
let userHasInteracted = false;

/** Whether sound is enabled (user preference). */
let soundEnabled = (() => {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("ulmind:hero-sound");
  return saved !== "off";
})();

// Track first user interaction to unlock audio autoplay.
if (typeof window !== "undefined") {
  const markInteracted = () => {
    userHasInteracted = true;
    window.removeEventListener("click", markInteracted);
    window.removeEventListener("touchstart", markInteracted);
    window.removeEventListener("keydown", markInteracted);
  };
  window.addEventListener("click", markInteracted, { once: true });
  window.addEventListener("touchstart", markInteracted, { once: true });
  window.addEventListener("keydown", markInteracted, { once: true });
}

export const stopTravelSound = () => {
  if (currentAudio) {
    // Fade out smoothly instead of abrupt stop
    const audio = currentAudio;
    const fadeStep = 0.05;
    const fadeInterval = setInterval(() => {
      if (audio.volume > fadeStep) {
        audio.volume -= fadeStep;
      } else {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        clearInterval(fadeInterval);
      }
    }, 30);
    currentAudio = null;
  }
  if (audioStopTimeout) {
    clearTimeout(audioStopTimeout);
    audioStopTimeout = null;
  }
};

const getNoiseBuffer = () => {
  if (!audioCtx) return null;
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = audioCtx.sampleRate * 3;
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
};

const playTravelSound = (index: number) => {
  if (typeof window === "undefined") return;
  if (!soundEnabled || !userHasInteracted) return;

  stopTravelSound();

  const audioSources = [
    "/Music/freesound_community-asia-travel-orchestra-short-62977.mp3",
    "/Music/freesound_community-slow-sea-travel-in-new-world-62974.mp3",
    "/Music/grand_project-dreamy-travel-vlog-gentle-wind_outro-477854.mp3",
    "/Music/audiorezout-cutiefly-sting-corporate-presentation-travel-vlog-music-213418.mp3",
    "/Music/audiorezout-oregano-sting-inspiring-summer-success-travel-vlog-music-196931.mp3",
    "/Music/grand_project-dreamy-travel-vlog-gentle-wind_outro-477854.mp3"
  ];

  if (index < audioSources.length) {
    const audio = new Audio(audioSources[index]);
    audio.volume = 0;
    currentAudio = audio;

    audio.play().then(() => {
      // Fade in smoothly
      const targetVolume = 0.6;
      const fadeStep = targetVolume / (AUDIO_FADE_DURATION / 30);
      const fadeIn = setInterval(() => {
        if (audio.volume < targetVolume - fadeStep) {
          audio.volume = Math.min(audio.volume + fadeStep, targetVolume);
        } else {
          audio.volume = targetVolume;
          clearInterval(fadeIn);
        }
      }, 30);
    }).catch(() => {
      // Autoplay was blocked — user hasn't interacted yet
      currentAudio = null;
    });

    audioStopTimeout = window.setTimeout(stopTravelSound, SLIDE_DURATION_MS);
    return;
  }

  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    
    const type = index % 5; 
    const t = audioCtx.currentTime;

    if (type === 0) {
      // Ocean Wave
      const noise = audioCtx.createBufferSource();
      noise.buffer = getNoiseBuffer();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      const gain = audioCtx.createGain();

      filter.frequency.setValueAtTime(100, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + 1.5);
      filter.frequency.exponentialRampToValueAtTime(100, t + 3);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 1.5);
      gain.gain.linearRampToValueAtTime(0, t + 3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(t);
      noise.stop(t + 3);
    } 
    else if (type === 1) {
      // Airplane Jet Swoosh
      const noise = audioCtx.createBufferSource();
      noise.buffer = getNoiseBuffer();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1;
      const gain = audioCtx.createGain();

      filter.frequency.setValueAtTime(3000, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 2.5);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.8, t + 1);
      gain.gain.linearRampToValueAtTime(0, t + 2.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(t);
      noise.stop(t + 2.5);
    }
    else if (type === 2) {
      // Camera Shutter
      const noise = audioCtx.createBufferSource();
      noise.buffer = getNoiseBuffer();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 4000;
      const gain = audioCtx.createGain();

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      const osc = audioCtx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(800, t);
      const oscGain = audioCtx.createGain();
      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.setValueAtTime(0.5, t + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);

      noise.start(t);
      noise.stop(t + 0.15);
      osc.start(t);
      osc.stop(t + 0.1);
    }
    else if (type === 3) {
      // Ship Horn
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.value = 73.42; // D2
      osc2.frequency.value = 74;    // Slightly detuned
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 0.2);
      gain.gain.linearRampToValueAtTime(0.4, t + 1.5);
      gain.gain.linearRampToValueAtTime(0, t + 2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 2);
      osc2.stop(t + 2);
    }
    else if (type === 4) {
      // Wind / Breeze
      const noise = audioCtx.createBufferSource();
      noise.buffer = getNoiseBuffer();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      
      const gain = audioCtx.createGain();

      filter.frequency.setValueAtTime(200, t);
      filter.frequency.linearRampToValueAtTime(500, t + 1);
      filter.frequency.linearRampToValueAtTime(200, t + 2);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 1);
      gain.gain.linearRampToValueAtTime(0, t + 2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(t);
      noise.stop(t + 2);
    }
  } catch (err) {}
};

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
  const heroRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(soundEnabled);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);
  
  const prevIndex = useRef(index);
  useEffect(() => {
    if (!isVisible) {
      stopTravelSound();
    } else if (isSoundOn) {
      playTravelSound(index);
    }
    prevIndex.current = index;
  }, [index, isVisible, isSoundOn]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopTravelSound();
  }, []);

  const toggleSound = useCallback(() => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    soundEnabled = next;
    localStorage.setItem("ulmind:hero-sound", next ? "on" : "off");
    
    if (!next) {
      stopTravelSound();
    } else {
      // Mark interaction so audio can play
      userHasInteracted = true;
      playTravelSound(index);
    }
  }, [isSoundOn, index]);

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
      ref={heroRef}
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
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6 sm:pb-16 lg:px-10 lg:pb-24">
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
                className="font-serif text-[2.5rem] leading-[1.05] tracking-tight text-cream-50 sm:text-6xl lg:text-8xl"
              >
                <LetterReveal text={active.headlinePrefix} />
                <br />
                <span className="italic">
                  <LetterReveal text={active.headlineAccent} delay={0.35} />
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream-50/85 sm:text-base">
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

      {/* Sound toggle button */}
      <button
        type="button"
        aria-label={isSoundOn ? "Mute slide audio" : "Enable slide audio"}
        onClick={toggleSound}
        className="absolute left-6 bottom-6 z-20 grid size-10 place-items-center rounded-full border border-cream-50/30 text-cream-50 backdrop-blur-md transition-all duration-300 hover:bg-cream-50/10 hover:border-cream-50/50 lg:left-10 lg:bottom-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isSoundOn ? "on" : "off"}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </button>

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
          className="group relative flex h-full translate-y-1 items-center justify-between gap-4 overflow-hidden rounded-xl border border-cream-50/10 bg-cream-50/[0.03] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/90 shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:border-cream-50/20 hover:bg-cream-50/5 active:scale-[0.98] md:rounded-full"
        >
          <span className="relative z-10">Find sanctuary</span>
          <div className="relative z-10 flex size-6 items-center justify-center">
            <ArrowRight className="size-4 text-gold transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.5} />
          </div>
          {/* Champagne shimmer */}
          <div className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-cream-50/[0.03] to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
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

