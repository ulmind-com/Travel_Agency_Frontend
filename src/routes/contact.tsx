import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { Field, inputClass } from "@/routes/auth.login";

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
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);
  return (
    <div className="pt-24 pb-24">
      <Container className="grid gap-16 lg:grid-cols-2">
        <FadeUp>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Concierge</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-ink-900 md:text-6xl">
            Tell us where you dream of.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-900/70">
            Whether you have a destination in mind or a feeling — a quiet
            morning, an unbroken horizon — our advisors will design an
            itinerary that fits.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-ink-900/80">
            <li className="flex items-center gap-3">
              <Mail className="size-4" /> concierge@ulmind.travel
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-4" /> +91 22 4000 2020
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="size-4" /> Live WhatsApp · 09:00 – 22:00 IST
            </li>
          </ul>
        </FadeUp>

        <FadeUp delay={0.1}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSending(true);
              setTimeout(() => {
                setSending(false);
                toast.success("Message received — a concierge will reply within one business day.");
                (e.target as HTMLFormElement).reset();
              }, 500);
            }}
            className="space-y-4 rounded-3xl border border-ink-900/5 bg-cream-50 p-8"
          >
            <Field label="Full name"><input required name="name" className={inputClass} placeholder="Your name" /></Field>
            <Field label="Email"><input required type="email" name="email" className={inputClass} placeholder="you@domain.com" /></Field>
            <Field label="Dream destination"><input name="destination" className={inputClass} placeholder="Amalfi, Kyoto, the Arctic Circle…" /></Field>
            <Field label="Message"><textarea name="message" required rows={5} className={inputClass + " min-h-32"} placeholder="Tell us what you're imagining." /></Field>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-full bg-ink-900 py-4 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send to concierge"}
            </button>
          </form>
        </FadeUp>
      </Container>
    </div>
  );
}