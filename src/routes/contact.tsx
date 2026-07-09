import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { LetterReveal } from "@/components/motion/letter-reveal";
import { Field, inputClass } from "@/routes/auth.login";

import maldives from "@/assets/hero-slide-maldives.jpg";
import kyoto from "@/assets/hero-slide-kyoto.jpg";
import alps from "@/assets/hero-slide-alps.jpg";

const SLIDES = [
  { imageUrl: maldives, caption: "Reef mornings, Baa Atoll" },
  { imageUrl: kyoto, caption: "Arashiyama at first light" },
  { imageUrl: alps, caption: "Alpine hush, St. Moritz" },
];

const HERO_MS = 5500;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Concierge · Ulmind Travel" },
      {
        name: "description",
        content:
          "Reach the Ulmind concierge to design a private itinerary or plan an upcoming journey.",
      },
      { property: "og:title", content: "Concierge · Ulmind Travel" },
      { property: "og:description", content: "Reach the Ulmind concierge team." },
      { property: "og:image", content: maldives },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactHero() {
  const [index, setIndex] = useState(0);
  const total = SLIDES.length;
  const active = SLIDES[index]!;

  useEffect(() => {
    const t = window.setTimeout(() => setIndex((n) => (n + 1) % total), HERO_MS);
    return () => window.clearTimeout(t);
  }, [index, total]);

  useEffect(() => {
    const nxt = SLIDES[(index + 1) % total];
    if (!nxt) return;
    const img = new Image();
    img.src = nxt.imageUrl;
  }, [index, total]);

  return (
    <section className="relative h-screen min-h-screen w-full overflow-hidden bg-ink-900">
      <AnimatePresence mode="sync">
        <motion.div
          key={active.imageUrl}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={active.imageUrl}
            alt={active.caption}
            className="h-full w-full object-cover"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.18 }}
            transition={{ duration: 8, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/45 via-ink-900/20 to-ink-900/80" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-16 pt-24 lg:px-10 lg:pb-24">
        <div className="max-w-3xl">
          <nav className="mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-cream-50/80">
            <Link to="/" className="hover:text-cream-50">Home</Link>
            <span className="opacity-40">·</span>
            <span className="text-cream-50">Concierge</span>
          </nav>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.imageUrl + ":t"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/90">
                The Concierge · Ulmind
              </p>
              <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-cream-50 sm:text-6xl lg:text-8xl">
                <LetterReveal text="Tell us where" />
                <br />
                <span className="italic">
                  <LetterReveal text="you dream of." delay={0.35} />
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-cream-50/85">
                A destination in mind, or only a feeling — a quiet morning,
                an unbroken horizon. Our advisors compose the rest.
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-widest text-cream-50/70">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-3.5" /> Kolkata · India
            </span>
            <span className="opacity-50">·</span>
            <span>Private concierge · 24/7</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-6 z-20 flex items-center gap-3 lg:bottom-10 lg:right-10">
        <span className="hidden font-serif text-sm text-cream-50/70 tabular-nums sm:inline">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-2 opacity-40">/</span>
          {String(total).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.imageUrl}
              type="button"
              aria-label={"Slide " + (i + 1)}
              onClick={() => setIndex(i)}
              className="relative h-[2px] w-10 overflow-hidden bg-cream-50/25"
            >
              <motion.span
                className="absolute inset-y-0 left-0 bg-cream-50"
                initial={false}
                animate={{ width: i === index ? "100%" : i < index ? "100%" : "0%" }}
                transition={
                  i === index
                    ? { duration: HERO_MS / 1000, ease: "linear" }
                    : { duration: 0.3 }
                }
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const CONTACT_ITEMS = [
  {
    icon: Phone,
    title: "Direct concierge line",
    lines: ["+91 98302 72407", "+91 93395 73953"],
  },
  {
    icon: Mail,
    title: "Written concierge",
    lines: ["concierge@ulmind.travel", "advisors@ulmind.travel"],
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    lines: ["09:00 – 22:00 IST", "Reply within the hour"],
  },
  {
    icon: MapPin,
    title: "Studio",
    lines: ["Kolkata · India", "By appointment"],
  },
] as const;

function ContactPage() {
  const [sending, setSending] = useState(false);

  return (
    <div>
      <ContactHero />

      {/* Editorial concierge + form */}
      <section id="concierge-form" className="relative bg-cream-50 py-24 lg:py-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            {/* Copy */}
            <div>
              <FadeUp>
                <p className="font-script text-3xl text-ink-900/80 sm:text-4xl">
                  A Private Line
                </p>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
                  One conversation, <br />
                  <span className="italic">an entire journey.</span>
                </h2>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-900/60 sm:text-lg">
                  Every itinerary begins with a quiet call. We listen for the
                  weather you want to wake up to, the pace, the table you'd
                  rather sit at — and we build outward from there.
                </p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-900/60 sm:text-lg">
                  Share a few notes below, or reach us directly.
                </p>
              </FadeUp>

              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                {CONTACT_ITEMS.map((c, i) => (
                  <FadeUp key={c.title} delay={0.05 * (i + 1)}>
                    <div className="flex items-start gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-900 text-cream-50 shadow-[0_15px_30px_-15px_rgba(28,25,23,0.5)]">
                        <c.icon className="size-5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg text-ink-900">{c.title}</h3>
                        {c.lines.map((l) => (
                          <p key={l} className="mt-0.5 text-sm text-ink-900/60">{l}</p>
                        ))}
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-10 hidden size-72 rounded-full bg-cream-100/80 blur-3xl lg:block"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -left-10 hidden size-64 rounded-full bg-ink-900/[0.04] blur-3xl lg:block"
              />
              <FadeUp delay={0.15}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSending(true);
                    setTimeout(() => {
                      setSending(false);
                      toast.success(
                        "Message received — a concierge will reply within one business day."
                      );
                      (e.target as HTMLFormElement).reset();
                    }, 500);
                  }}
                  className="relative space-y-5 rounded-3xl border border-ink-900/5 bg-white/95 p-8 shadow-[0_40px_80px_-40px_rgba(28,25,23,0.35)] backdrop-blur-sm lg:p-10"
                >
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="font-serif text-2xl text-ink-900">
                      Begin the conversation
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-ink-900/40">
                      Private
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name">
                      <input required name="name" className={inputClass} placeholder="Your name" />
                    </Field>
                    <Field label="Email">
                      <input required type="email" name="email" className={inputClass} placeholder="you@domain.com" />
                    </Field>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Phone">
                      <input type="tel" name="phone" className={inputClass} placeholder="+91 …" />
                    </Field>
                    <Field label="Dream destination">
                      <input name="destination" className={inputClass} placeholder="Kashmir, Kyoto, the Arctic…" />
                    </Field>
                  </div>
                  <Field label="Message">
                    <textarea
                      name="message"
                      required
                      rows={5}
                      className={inputClass + " min-h-32 resize-none"}
                      placeholder="Tell us what you're imagining — a season, a pace, an occasion."
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={sending}
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink-900 py-4 text-[12px] font-medium uppercase tracking-[0.25em] text-cream-50 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send to concierge"}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="text-center text-[11px] text-ink-900/40">
                    We reply within one business day.
                  </p>
                </form>
              </FadeUp>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-y border-ink-900/10 bg-cream-100/50 py-8">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            {["Private advisors", "24/7 concierge", "Bespoke itineraries", "Trusted since 2014"].map((t, i, a) => (
              <div key={t} className="flex items-center gap-10">
                <span className="font-serif text-sm italic text-ink-900/60 sm:text-base">
                  {t}
                </span>
                {i < a.length - 1 && (
                  <span className="hidden text-ink-900/20 sm:inline">·</span>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Closing dark CTA */}
      <section className="relative overflow-hidden bg-ink-900 py-24 text-cream-50 lg:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/2 hidden size-96 -translate-y-1/2 rounded-full bg-cream-50/[0.04] blur-3xl lg:block"
        />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <FadeUp>
              <p className="font-script text-3xl text-cream-50/70 sm:text-4xl">
                Ready when you are
              </p>
              <h3 className="mt-3 font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Begin a private <span className="italic">conversation.</span>
              </h3>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream-50/70">
                An advisor will design a first sketch of your journey within
                one business day — no templates, no rush.
              </p>
              <a
                href="#concierge-form"
                className="mt-10 inline-flex items-center gap-3 rounded-full bg-cream-50 px-8 py-4 text-xs uppercase tracking-[0.25em] text-ink-900 transition-transform hover:-translate-y-0.5"
              >
                Send a note
                <ArrowRight className="size-4" />
              </a>
            </FadeUp>
          </div>
        </Container>
      </section>
    </div>
  );
}