import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { AxiosError } from "axios";

import { BookingPanel } from "@/components/package-detail/booking-panel";
import { Gallery } from "@/components/package-detail/gallery";
import { ItineraryTabs } from "@/components/package-detail/itinerary-tabs";
import { ReviewsSection } from "@/components/package-detail/reviews-section";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { packageDetailQuery } from "@/lib/queries";

export const Route = createFileRoute("/packages/$id")({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData(packageDetailQuery(params.id));
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) throw notFound();
      throw err;
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Escape unavailable · Ulmind" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const pkg = loaderData;
    const desc =
      pkg.description?.slice(0, 155) ??
      `Curated ${pkg.duration_nights}-night escape by Ulmind Travel.`;
    return {
      meta: [
        { title: `${pkg.title} · Ulmind Travel` },
        { name: "description", content: desc },
        { property: "og:title", content: pkg.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        pkg.thumbnail?.url
          ? { property: "og:image", content: pkg.thumbnail.url }
          : { name: "meta:none", content: "" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Not found</p>
      <h1 className="mt-4 font-serif text-4xl text-ink-900">This escape is unavailable.</h1>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="font-serif text-3xl text-ink-900">Could not load</p>
      <p className="mt-2 text-sm text-ink-900/60">{error.message}</p>
    </div>
  ),
  component: PackageDetailPage,
});

function PackageDetailPage() {
  const { id } = Route.useParams();
  const { data: pkg } = useSuspenseQuery(packageDetailQuery(id));

  return (
    <div className="pt-24">
      <Container className="py-6">
        <FadeUp>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            {pkg.category.toLowerCase()} · {pkg.destinations.join(" · ")}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-ink-900 md:text-6xl">
            {pkg.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-900/70">
            {pkg.description}
          </p>
        </FadeUp>
      </Container>

      <Container className="pb-8">
        <Gallery images={pkg.gallery_images} fallback={pkg.thumbnail} title={pkg.title} />
      </Container>

      <Container className="grid gap-16 py-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-16">
          {pkg.itinerary.length > 0 && (
            <section>
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
                Journey
              </p>
              <h2 className="mt-3 mb-8 font-serif text-4xl text-ink-900">The itinerary</h2>
              <ItineraryTabs days={pkg.itinerary} />
            </section>
          )}

          <section className="grid gap-10 md:grid-cols-2">
            <IncExc title="What is included" items={pkg.inclusions} icon={<Check className="size-4" />} tone="pos" />
            <IncExc title="What is not" items={pkg.exclusions} icon={<X className="size-4" />} tone="neg" />
          </section>

          {pkg.required_traveler_documents.length > 0 && (
            <section>
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
                Required documents
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {pkg.required_traveler_documents.map((d) => (
                  <li
                    key={d}
                    className="rounded-full border border-ink-900/10 bg-cream-50 px-3 py-1.5 text-xs text-ink-900/70"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pkg.cancellation_policy && (
            <section>
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
                Cancellation
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-900/70">
                {pkg.cancellation_policy}
              </p>
            </section>
          )}

          <ReviewsSection packageId={pkg.id} />
        </div>

        <div className="min-w-0">
          <BookingPanel pkg={pkg} />
        </div>
      </Container>
    </div>
  );
}

function IncExc({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  tone: "pos" | "neg";
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.length === 0 && (
          <li className="text-sm text-ink-900/40">—</li>
        )}
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3 text-sm text-ink-900/80">
            <span
              className={
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full " +
                (tone === "pos" ? "bg-ink-900 text-cream-50" : "bg-cream-200 text-ink-900/70")
              }
            >
              {icon}
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}