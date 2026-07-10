import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronsRight, Compass, UserRound } from "lucide-react";

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
      {/* Hero banner — teal with diagonal photo strips */}
      <section className="relative w-full overflow-hidden bg-[#5FA79A] pt-28 lg:pt-32">
        {/* Decorative dot grids */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[38%] top-24 h-16 w-16 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.55) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-16 left-[30%] h-14 w-14 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.55) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-10 top-6 h-12 w-24 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />

        <Container>
          <div className="relative grid min-h-[560px] gap-10 pb-20 lg:min-h-[680px] lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-28">
            {/* Left: text */}
            <div className="relative z-10 flex flex-col justify-center text-cream-50">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cream-50/80">
                About Ulmind Travel
              </p>
              <h1 className="mt-6 flex flex-wrap items-center gap-x-4 font-sans text-6xl font-extrabold uppercase leading-[0.95] tracking-tight text-cream-50 sm:text-7xl lg:text-[88px]">
                <span>
                  Travel
                  <br />
                  The World
                </span>
                <ChevronsRight
                  className="mt-3 hidden size-10 text-cream-50/70 lg:inline"
                  strokeWidth={2.5}
                />
              </h1>
              <p className="mt-8 max-w-lg font-serif text-2xl italic leading-snug text-cream-50">
                “Explore the world with a trusted travel partner — discover new
                destinations, unforgettable experiences & endless adventures.”
              </p>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-cream-50/85">
                At Ulmind Travel, we are committed to turning your travel dreams
                into reality. With years of experience in the travel and tourism
                industry, we offer personalized services, curated itineraries,
                and unforgettable experiences.
              </p>

              <div className="mt-10 flex items-center gap-6">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-3 rounded-full bg-ink-900 px-8 py-4 text-xs font-medium uppercase tracking-[0.25em] text-cream-50 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Book Now
                  <ArrowRight className="size-4" />
                </Link>

                <div className="flex items-center gap-3">
                  {["IG", "FB", "TW"].map((label) => (
                    <span
                      key={label}
                      className="grid size-9 place-items-center rounded-full bg-cream-50/15 text-[10px] font-semibold text-cream-50 ring-1 ring-cream-50/25 backdrop-blur-sm"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: diagonal photo strips (SVG capsule clip).
                Breaks out of the grid column so the strips can anchor
                against the true top-right corner of the hero. */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] lg:block">
              {(() => {
                // Strips descend from top-right corner toward bottom-left,
                // flat where they exit the top of the hero, rounded only
                // at the bottom end. We draw tall vertical "flat-top,
                // rounded-bottom" capsules whose tops start ABOVE the
                // viewBox (so the top edge is clipped flat by the SVG
                // viewport) and rotate them so they lean like "\".
                const VBW = 780;
                const VBH = 780;
                const W = 116;               // strip thickness
                const R = W / 2;             // bottom cap radius
                const TOP = -320;            // starts well above viewport (flat-cut)
                const BOT = 680;             // rounded end inside viewport
                const ANGLE = 24;            // positive → leans like "\"
                // Flat top, rounded bottom capsule (vertical), centered on x=0.
                const pill = [
                  `M ${-R},${TOP}`,
                  `L ${R},${TOP}`,
                  `L ${R},${BOT - R}`,
                  `A ${R},${R} 0 0 1 ${-R},${BOT - R}`,
                  "Z",
                ].join(" ");
                // Anchors at the TOP edge of the panel; strips fan from the
                // top-right corner down-left because of the +22° rotation
                // around each anchor point (y=0).
                // Anchor all strips near the top-right corner and fan
                // outward down-left because of the +24° rotation.
                // Anchor everything at the top-right corner: rightmost
                // strip sits at the right edge, siblings stack to its left
                // and fan diagonally down-left from the +24° rotation.
                // Fan from the top-right corner: rightmost strip hugs
                // the right edge, the others step left with clean gaps.
                const strips = [
                  { cx: 320, cy: 0 },
                  { cx: 480, cy: 0 },
                  { cx: 640, cy: 0 },
                  { cx: 800, cy: 0 },
                ];
                return (
                  <svg
                    viewBox={`0 0 ${VBW} ${VBH}`}
                    preserveAspectRatio="xMaxYMin slice"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden
                  >
                    <defs>
                      <clipPath id="about-strips">
                        {strips.map((s, i) => (
                          <path
                            key={i}
                            d={pill}
                            transform={`translate(${s.cx} ${s.cy}) rotate(${ANGLE})`}
                          />
                        ))}
                      </clipPath>
                      <filter
                        id="about-strip-shadow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="14"
                          stdDeviation="16"
                          floodColor="#000"
                          floodOpacity="0.3"
                        />
                      </filter>
                    </defs>

                    {/* Faint lighter-teal parallel band behind strips */}
                    <g opacity="0.28">
                      <path
                        d={pill}
                        transform={`translate(680 0) rotate(${ANGLE}) scale(3.4 1)`}
                        fill="#8FC4B9"
                      />
                    </g>

                    <g filter="url(#about-strip-shadow)" clipPath="url(#about-strips)">
                      <image
                        href={heroBg}
                        x="0"
                        y="0"
                        width={VBW}
                        height={VBH}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                  </svg>
                );
              })()}
            </div>
          </div>
        </Container>

        {/* Mobile strips */}
        <div className="relative -mt-6 grid grid-cols-3 gap-3 px-6 pb-12 lg:hidden">
          {[shapeAlps, heroBg, shapeKyoto].map((img, i) => (
            <div
              key={i}
              className="h-52 overflow-hidden rounded-full shadow-lg"
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Shape collage section */}
      <section className="relative bg-cream-50 py-24 lg:py-32">
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
                <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
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