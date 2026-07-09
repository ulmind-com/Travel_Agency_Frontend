import { FadeUp } from "@/components/motion/fade-up";
import portrait from "@/assets/testimonial-portrait.jpg";

export function Testimonial() {
  return (
    <section className="relative flex min-h-[520px] items-center bg-ink-900 py-24">
      <img
        src={portrait}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-ink-900/50" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10">
        <FadeUp>
          <blockquote className="font-serif text-3xl italic leading-tight text-cream-50 md:text-5xl">
            &ldquo;There is a specific kind of luxury that doesn&apos;t scream.
            It&apos;s the sound of a silk curtain moving in the breeze, and the
            knowledge that everything has been thought of before you even
            arrived.&rdquo;
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <span className="h-px w-12 bg-cream-50/40" />
            <span className="text-sm uppercase tracking-widest text-cream-50">
              Julianne V. — Paris · Private Member since 2019
            </span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}