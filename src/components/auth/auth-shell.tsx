import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import heroImg from "@/assets/hero-tuscany.jpg";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden lg:block">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-ink-900/10" />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream-50">
          <Link to="/" className="font-serif text-3xl">Ulmind</Link>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cream-50/70">Private members</p>
            <p className="mt-3 max-w-md font-serif text-4xl italic">
              &ldquo;Every journey we shaped for them still lives in the way they speak.&rdquo;
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-cream-50 px-6 py-16 lg:px-16">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 block font-serif text-2xl lg:hidden">Ulmind</Link>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">{subtitle}</p>
          <h1 className="mt-3 font-serif text-4xl text-ink-900">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}