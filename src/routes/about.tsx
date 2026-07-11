import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, UserRound } from "lucide-react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import heroBg from "@/assets/hero-slide-maldives.jpg";
import shapeAlps from "@/assets/hero-slide-alps.jpg";
import shapeKyoto from "@/assets/hero-slide-kyoto.jpg";
import shapeRajasthan from "@/assets/hero-slide-rajasthan.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Ulmind Travel" },
      {
        name: "description",
        content:
          "Explore the world with a trusted travel partner — Ulmind Travel composes bespoke journeys with expert guides and exclusive trips.",
      },
      { property: "og:title", content: "About · Ulmind Travel" },
      {
        property: "og:description",
        content:
          "Explore the world with a trusted travel partner — Ulmind Travel composes bespoke journeys with expert guides and exclusive trips.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function RoundedPhoto({
  imageUrl,
  className = "",
  aspect = "aspect-[4/5]",
}: {
  imageUrl: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={
        "relative w-full overflow-hidden rounded-3xl bg-cream-100 ring-1 ring-ink-900/5 shadow-[0_30px_60px_-25px_rgba(28,25,23,0.35)] " +
        aspect +
        " " +
        className
      }
    >
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      {/* Hero banner */}
      <section className="relative h-[420px] w-full overflow-hidden lg:h-[520px]">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/55 to-ink-900/70" />
        <div className="relative flex h-full flex-col items-center justify-center text-center text-cream-50">
          <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            About
          </h1>
          <nav className="mt-4 flex items-center gap-3 text-sm text-cream-50/90">
            <Link to="/" className="hover:text-cream-50">Home</Link>
            <ArrowRight className="size-4" />
            <span>About</span>
          </nav>
        </div>
      </section>

      {/* Shape collage section */}
      <section className="relative bg-cream-50 py-14 sm:py-24 lg:py-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
            <div className="relative order-2 lg:order-1">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 top-10 hidden size-64 rounded-full bg-cream-100/80 blur-3xl lg:block"
              />
              <div className="relative mx-auto h-[560px] w-full max-w-[560px] sm:h-[640px]">
                {/* Top-left tall */}
                <FadeUp className="absolute left-0 top-0 w-[55%]">
                  <RoundedPhoto imageUrl={shapeAlps} aspect="aspect-[4/5]" />
                </FadeUp>
                {/* Middle-right, offset down */}
                <FadeUp
                  delay={0.08}
                  className="absolute right-0 top-[26%] w-[55%]"
                >
                  <RoundedPhoto imageUrl={shapeKyoto} aspect="aspect-[4/5]" />
                </FadeUp>
                {/* Bottom-left */}
                <FadeUp
                  delay={0.16}
                  className="absolute bottom-0 left-[8%] w-[50%]"
                >
                  <RoundedPhoto
                    imageUrl={shapeRajasthan}
                    aspect="aspect-[5/4]"
                  />
                </FadeUp>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <FadeUp>
                <p className="font-script text-3xl text-ink-900/80 sm:text-4xl">
                  Welcome To Ulmind Travel
                </p>
                <h2 className="mt-3 font-serif text-3xl font-medium leading-[1.1] text-ink-900 sm:text-5xl lg:text-6xl">
                  Explore the World with a Trusted Travel Partner
                </h2>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-900/60 sm:text-lg">
                  At Ulmind Travel, we are committed to turning your travel
                  dreams into reality. With years of experience in the travel
                  and tourism industry, we take pride in offering personalized
                  services, curated itineraries, and unforgettable travel
                  experiences.
                </p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-900/60 sm:text-lg">
                  Whether you are looking for a serene getaway, an adventurous
                  journey, or a cultural exploration, we have something for
                  every traveler. Our team works tirelessly to provide the best
                  travel deals and seamless services, ensuring your journey is
                  as enjoyable as the destination itself.
                </p>
              </FadeUp>

              <div className="mt-10 space-y-8">
                <FadeUp delay={0.05}>
                  <div className="flex items-start gap-5">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-900 text-cream-50 shadow-[0_15px_30px_-15px_rgba(28,25,23,0.5)]">
                      <Compass className="size-6" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-2xl text-ink-900">Exclusive Trip</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-900/60">
                        Ulmind Travel offers exclusive trips tailored to your
                        needs, ensuring a unique and unforgettable experience
                        for every traveler.
                      </p>
                    </div>
                  </div>
                </FadeUp>
                <FadeUp delay={0.1}>
                  <div className="flex items-start gap-5">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-900 text-cream-50 shadow-[0_15px_30px_-15px_rgba(28,25,23,0.5)]">
                      <UserRound className="size-6" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-2xl text-ink-900">Professional Guide</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-900/60">
                        Our expert guides ensure a smooth and informative
                        journey, offering local insights and making your trip
                        enjoyable.
                      </p>
                    </div>
                  </div>
                </FadeUp>
              </div>

              <FadeUp delay={0.25}>
                <Link
                  to="/contact"
                  className="mt-12 inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 text-xs uppercase tracking-[0.25em] text-cream-50 transition-transform hover:-translate-y-0.5"
                >
                  Contact With Us
                  <ArrowRight className="size-4" />
                </Link>
              </FadeUp>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}