import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import heroImg from "@/assets/hero-slide-iceland.jpg";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-900 px-6 py-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/50 via-ink-900/25 to-ink-900/80" />
        <div className="absolute inset-0 bg-ink-900/20 backdrop-blur-[2px]" />
      </div>

      {/* Soft ambient glow behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[520px] w-[520px] rounded-full bg-gold/10 blur-[120px]" />
      </div>

      {/* Liquid glass card */}
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-cream-50/15 bg-gradient-to-b from-cream-50/[0.07] to-cream-50/[0.02] p-8 shadow-2xl shadow-ink-900/30 ring-1 ring-inset ring-cream-50/5 backdrop-blur-3xl md:p-10">
          {/* Decorative liquid highlight along the top edge */}
          <div className="pointer-events-none absolute top-0 left-1/2 z-10 h-[1px] w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cream-50/30 to-transparent" />

          {/* Subtle inner sheen */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cream-50/5 blur-3xl" />

          {/* Logo */}
          <Link to="/" className="mb-6 flex items-center justify-center">
            <span className="font-serif text-3xl text-cream-50">Ulmind</span>
          </Link>

          {/* Subtitle */}
          <p className="text-center text-[11px] uppercase tracking-[0.3em] text-cream-50/50">
            {subtitle}
          </p>

          {/* Title */}
          <h1 className="mt-2 text-center font-serif text-4xl text-cream-50">
            {title}
          </h1>

          {/* Content */}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
