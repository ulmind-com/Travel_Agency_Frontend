import { createFileRoute } from "@tanstack/react-router";

import { CollectionsScroll } from "@/components/home/collections-scroll";
import { CtaFooter } from "@/components/home/cta-footer";
import { FeaturedPackages } from "@/components/home/featured-packages";
import { Hero } from "@/components/home/hero";
import { StatsRow } from "@/components/home/stats-row";
import { Testimonial } from "@/components/home/testimonial";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ulmind Travel — Quiet luxury, curated journeys" },
      {
        name: "description",
        content:
          "Private itineraries and concierge-led escapes to Amalfi, the Maldives, Kyoto, the Swiss Alps and beyond — thoughtfully composed by Ulmind Travel.",
      },
      { property: "og:title", content: "Ulmind Travel — Quiet luxury, curated journeys" },
      {
        property: "og:description",
        content:
          "Boutique luxury travel — from Amalfi villas to Arctic fjords.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <StatsRow />
      <FeaturedPackages />
      <CollectionsScroll />
      <Testimonial />
      <CtaFooter />
    </div>
  );
}
