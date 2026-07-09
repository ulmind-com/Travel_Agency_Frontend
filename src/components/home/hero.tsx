import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";

import { LetterReveal } from "@/components/motion/letter-reveal";
import heroImg from "@/assets/hero-tuscany.jpg";

export function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[720px] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt="Misty Tuscan valley at dawn"
          className="h-full w-full object-cover"
          width={1920}
          height={1200}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50/20 via-transparent to-ink-900/40" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-16 pt-24 lg:px-10 lg:pb-24">
        <div className="max-w-3xl">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/90">
            The 2026 Portfolio · Now open
          </p>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-cream-50 sm:text-6xl lg:text-8xl">
            <LetterReveal text="The geography" />
            <br />
            <span className="italic">
              <LetterReveal text="of silence." delay={0.35} />
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-cream-50/85">
            Ulmind curates private journeys where quietness, craft, and place
            hold equal weight — from Amalfi villas to Arctic fjords.
          </p>

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
    </section>
  );
}

function SearchCard() {
  return (
    <form
      action="/packages"
      method="get"
      className="mt-10 grid gap-2 rounded-3xl bg-cream-50/95 p-2 shadow-[0_10px_40px_-15px_rgba(28,25,23,0.35)] ring-1 ring-black/5 backdrop-blur-xl md:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <FieldGroup icon={<MapPin className="size-3.5" />} label="Where" name="destination" placeholder="Any destination" />
      <FieldGroup icon={<Calendar className="size-3.5" />} label="When" name="when" placeholder="Add dates" type="text" />
      <FieldGroup icon={<Users className="size-3.5" />} label="Guests" name="guests" placeholder="2 adults" />
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-8 py-4 text-[12px] font-medium uppercase tracking-widest text-cream-50 ring-1 ring-ink-900 transition-transform active:scale-95"
      >
        Find sanctuary
      </button>
    </form>
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
    <label className="group flex flex-col rounded-2xl px-5 py-3 transition-colors hover:bg-cream-100">
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink-900/40">
        {icon} {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full border-none bg-transparent p-0 text-sm font-medium text-ink-900 placeholder:text-ink-900/30 focus:outline-none focus:ring-0"
      />
    </label>
  );
}