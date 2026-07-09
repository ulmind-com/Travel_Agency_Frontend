import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";

export function CtaFooter() {
  return (
    <section className="border-t border-ink-900/5 bg-cream-100 py-32 text-center">
      <Container>
        <FadeUp className="mx-auto flex max-w-2xl flex-col items-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            Begin
          </p>
          <h2 className="mt-4 font-serif text-4xl font-medium text-ink-900 md:text-5xl">
            Ready for your next chapter?
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-900/60">
            Our private advisors will design an itinerary that remains uniquely
            yours — no templates, no rush.
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink-900 py-4 pl-6 pr-5 text-[12px] font-medium uppercase tracking-widest text-cream-50 ring-1 ring-ink-900 transition-transform active:scale-95"
          >
            Request a consultation
            <ArrowRight className="size-4" />
          </Link>
        </FadeUp>
      </Container>
    </section>
  );
}