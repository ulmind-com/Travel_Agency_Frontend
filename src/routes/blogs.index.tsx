import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, User, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { LetterReveal } from "@/components/motion/letter-reveal";
import { useQuery } from "@tanstack/react-query";
import { getPublicBlogs, getFeaturedBlogs, getTrendingBlogs } from "@/services/blogs.service";
import { format } from "date-fns";

import heroBg from "@/assets/hero-slide-kyoto.jpg"; // Default fallback

export const Route = createFileRoute("/blogs/")({
  head: () => ({
    meta: [
      { title: "Journal · Ulmind Travel" },
      {
        name: "description",
        content: "Travel notes, destination essays, and quiet observations from the Ulmind Travel journal.",
      },
    ],
    links: [{ rel: "canonical", href: "/blogs" }],
  }),
  component: BlogsPage,
});

function BlogsPage() {
  const { data: featuredBlogs } = useQuery({
    queryKey: ["blogs", "featured"],
    queryFn: () => getFeaturedBlogs(3),
  });

  const { data: trendingBlogs } = useQuery({
    queryKey: ["blogs", "trending"],
    queryFn: () => getTrendingBlogs(4),
  });

  const { data: latestBlogs } = useQuery({
    queryKey: ["blogs", "latest"],
    queryFn: () => getPublicBlogs({ limit: 12 }),
  });

  const heroPost = featuredBlogs?.[0];

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Hero */}
      <section className="relative h-[65vh] w-full overflow-hidden lg:h-[80vh]">
        <img
          src={heroPost?.hero_image?.url || heroBg}
          alt={heroPost?.title || "Journal"}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/60 to-ink-900/90" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 text-cream-50">
          <FadeUp>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
              {heroPost?.category || "The Journal"}
            </p>
            <h1 className="font-serif text-4xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl max-w-4xl">
              {heroPost ? heroPost.title : (
                <>
                  <LetterReveal text="Notes from" />
                  <br />
                  <span className="italic">
                    <LetterReveal text="the road." delay={0.3} />
                  </span>
                </>
              )}
            </h1>
            {heroPost && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-50/80">
                {heroPost.short_description || heroPost.subtitle}
              </p>
            )}
            
            {heroPost && (
              <div className="mt-8 flex items-center gap-6 text-sm text-cream-50/60 font-medium tracking-wide">
                <span className="flex items-center gap-2"><Clock className="size-4" /> {heroPost.reading_time} min read</span>
                <span>{format(new Date(heroPost.published_at || heroPost.created_at), "MMMM dd, yyyy")}</span>
              </div>
            )}
            
            {heroPost && (
              <Link
                to={`/blogs/${heroPost.slug}`}
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-cream-50 px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink-900 transition-transform hover:scale-105"
              >
                Read Story <ArrowRight className="size-4" />
              </Link>
            )}
          </FadeUp>
        </div>
      </section>

      {/* Editor's Picks / Featured */}
      {featuredBlogs && featuredBlogs.length > 1 && (
        <section className="py-20 lg:py-28">
          <Container>
            <div className="flex items-end justify-between mb-12">
              <FadeUp>
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Curated</p>
                <h2 className="mt-2 font-serif text-3xl font-medium text-ink-900">Editor's Picks</h2>
              </FadeUp>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              {featuredBlogs.slice(1).map((post, i) => (
                <FadeUp key={post._id} delay={0.1 * i}>
                  <Link to={`/blogs/${post.slug}`} className="group flex flex-col gap-6 md:flex-row">
                    <div className="relative aspect-[4/3] md:w-1/2 overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-ink-900/5 shrink-0">
                      <img
                        src={post.hero_image?.url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-2">{post.category}</p>
                      <h3 className="font-serif text-2xl text-ink-900 group-hover:text-ink-900/70 transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink-900/60 line-clamp-3">
                        {post.short_description || post.subtitle}
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-ink-900/50 group-hover:text-ink-900">
                        Read full story <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Latest Stories */}
      <section className="py-20 lg:py-28 bg-white">
        <Container>
          <FadeUp>
            <h2 className="font-serif text-3xl font-medium text-ink-900 md:text-4xl text-center mb-16">
              Latest Stories
            </h2>
          </FadeUp>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestBlogs?.map((post, i) => (
              <FadeUp key={post._id} delay={0.05 * (i % 3)}>
                <article className="group flex h-full flex-col">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-ink-900/5">
                    <img
                      src={post.hero_image?.url || heroBg}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end text-cream-50 z-10">
                      <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-gold mb-3 font-bold">
                        <span>{post.category}</span>
                      </div>
                      <h3 className="font-serif text-xl leading-tight">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-ink-900/50">
                      {format(new Date(post.published_at || post.created_at), "MMM dd")}
                    </span>
                    <Link
                      to={`/blogs/${post.slug}`}
                      className="inline-flex size-8 items-center justify-center rounded-full bg-cream-100 text-ink-900 transition-colors group-hover:bg-gold"
                    >
                      <ArrowUpRight className="size-4" />
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

