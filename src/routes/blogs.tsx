import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { LetterReveal } from "@/components/motion/letter-reveal";

import heroBg from "@/assets/hero-slide-kyoto.jpg";
import post1 from "@/assets/gallery-2_kashmir-clean.jpg";
import post2 from "@/assets/hero-slide-maldives.jpg";
import post3 from "@/assets/hero-slide-rajasthan.jpg";
import post4 from "@/assets/gallery-5_vietnam-clean.jpg";

export const Route = createFileRoute("/blogs")({
  head: () => ({
    meta: [
      { title: "Journal · Ulmind Travel" },
      {
        name: "description",
        content:
          "Travel notes, destination essays, and quiet observations from the Ulmind Travel journal.",
      },
      { property: "og:title", content: "Journal · Ulmind Travel" },
      {
        property: "og:description",
        content:
          "Travel notes, destination essays, and quiet observations from the Ulmind Travel journal.",
      },
      { property: "og:image", content: heroBg },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/blogs" },
    ],
    links: [{ rel: "canonical", href: "/blogs" }],
  }),
  component: BlogsPage,
});

const POSTS = [
  {
    slug: "slow-travel-kashmir",
    title: "The Art of Slow Travel in Kashmir",
    excerpt:
      "Why the most revealing moments in the valley happen between destinations — on a shikara at dawn, or beneath a chinar tree.",
    image: post1,
    category: "Destinations",
    date: "June 2026",
  },
  {
    slug: "maldives-beyond-the-villa",
    title: "Maldives Beyond the Villa",
    excerpt:
      "Reef biologists, deserted sandbanks, and the private rituals that turn a beach holiday into a real escape.",
    image: post2,
    category: "Escapes",
    date: "May 2026",
  },
  {
    slug: "rajasthan-color-and-silence",
    title: "Rajasthan: Color and Silence",
    excerpt:
      "From the hush of Jaisalmer at noon to the lantern-lit courtyards of Jaipur after dark.",
    image: post3,
    category: "Culture",
    date: "April 2026",
  },
  {
    slug: "north-vietnam-road-notes",
    title: "North Vietnam Road Notes",
    excerpt:
      "Rice-terrace curves, mountain mist, and the kindness of strangers in the highlands above Sapa.",
    image: post4,
    category: "Journeys",
    date: "March 2026",
  },
];

function BlogsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[420px] w-full overflow-hidden lg:h-[520px]">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-ink-900/55 to-ink-900/70" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 text-center text-cream-50">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-cream-50/80">
            The Journal
          </p>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            <LetterReveal text="Notes from" />
            <br />
            <span className="italic">
              <LetterReveal text="the road." delay={0.3} />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-50/80">
            Travel essays, quiet observations, and the stories behind the
            itineraries we compose.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="bg-cream-50 py-20 lg:py-28">
        <Container>
          <FadeUp>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Latest entries
            </p>
            <h2 className="mt-4 font-serif text-4xl font-medium text-ink-900 md:text-5xl">
              Read the journey.
            </h2>
          </FadeUp>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {POSTS.map((post, i) => (
              <FadeUp key={post.slug} delay={0.05 * (i % 4)}>
                <article className="group flex h-full flex-col">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-ink-900/5">
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="mt-5 flex flex-1 flex-col">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-ink-900/40">
                      <span>{post.category}</span>
                      <span>{post.date}</span>
                    </div>
                    <h3 className="mt-2 font-serif text-xl text-ink-900 transition-colors group-hover:text-ink-900/80">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-900/60">
                      {post.excerpt}
                    </p>
                    <Link
                      to="/blogs"
                      className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-ink-900 transition-colors hover:text-ink-900/70"
                    >
                      Read more <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </article>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
