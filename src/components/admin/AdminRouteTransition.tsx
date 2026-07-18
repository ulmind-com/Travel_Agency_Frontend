import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Premium page-transition curtain for the Admin Studio. Whenever the admin
 * navigates from one section to another (or hits back), a full-screen luxury
 * overlay plays the brand travel Lottie for a beat, then dissolves to reveal
 * the new section. Purely presentational; the SPA navigation itself is instant.
 *
 * Deliberately framer-motion-free: mount/unmount is driven by plain timers and
 * the fade by a CSS transition, so the curtain always dismisses on time and can
 * never get wedged if the render loop stalls. The Lottie is driven by
 * lottie-web via a client-only dynamic import (SSR-safe).
 */
const HOLD_MS = 1000;
const FADE_MS = 320;

export function AdminRouteTransition({ pathname }: { pathname: string }) {
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false); // in the DOM
  const [visible, setVisible] = useState(false); // opacity target (drives CSS fade)
  const prev = useRef<string | null>(null);
  const lottieBox = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Fetch the brand animation once, on the client.
  useEffect(() => {
    let alive = true;
    fetch("/lottie/Travel.json")
      .then((r) => r.json())
      .then((j) => alive && setData(j))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Trigger the curtain on every admin section change (and back-navigation).
  useEffect(() => {
    const isAdmin = pathname.startsWith("/account/admin");
    if (prev.current !== null && prev.current !== pathname && isAdmin) {
      clearTimers();
      setMounted(true);
      // next tick → fade in
      timers.current.push(window.setTimeout(() => setVisible(true), 20));
      // hold, then fade out
      timers.current.push(window.setTimeout(() => setVisible(false), HOLD_MS));
      // after the fade-out transition, remove from the DOM (and destroy Lottie)
      timers.current.push(window.setTimeout(() => setMounted(false), HOLD_MS + FADE_MS));
    }
    prev.current = pathname;
  }, [pathname]);

  useEffect(() => clearTimers, []);

  // Play the Lottie while the curtain is mounted; destroy it on unmount so it
  // never keeps rendering in the background.
  useEffect(() => {
    if (!mounted || !data || !lottieBox.current) return;
    let anim: any;
    let cancelled = false;
    import("lottie-web").then((mod) => {
      if (cancelled || !lottieBox.current) return;
      anim = mod.default.loadAnimation({
        container: lottieBox.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: data,
      });
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [mounted, data]);

  if (!mounted || !data) return null;

  return (
    <div
      data-admin-transition
      style={{
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
        opacity: visible ? 1 : 0,
      }}
      className="fixed inset-0 z-[120] grid place-items-center overflow-hidden bg-cream-50/85 backdrop-blur-xl"
    >
      {/* Ambient luxury glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[120px]" />

      <div
        style={{
          transition: `transform ${FADE_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${FADE_MS}ms`,
          transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
          opacity: visible ? 1 : 0,
        }}
        className="relative flex flex-col items-center"
      >
        <div ref={lottieBox} style={{ width: 220, height: 220 }} aria-hidden />
        <p className="-mt-2 font-serif text-2xl tracking-tight text-ink-900">Ulmind</p>
        <div className="mt-3 h-[2px] w-24 overflow-hidden rounded-full bg-ink-900/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-gold" />
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.34em] text-ink-900/45">
          Preparing your studio
        </p>
      </div>
    </div>
  );
}
