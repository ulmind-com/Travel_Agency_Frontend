import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { packageReviewsQuery } from "@/lib/queries";
import { reviewsService } from "@/services/reviews.service";
import { cn } from "@/lib/utils";

export function ReviewsSection({ packageId }: { packageId: string }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery(packageReviewsQuery(packageId));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => reviewsService.create(packageId, { rating, comment }),
    onSuccess: () => {
      toast.success("Thanks for sharing your experience");
      setComment("");
      qc.invalidateQueries({ queryKey: ["reviews", packageId] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not submit review")),
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
      : null;

  return (
    <section className="py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Voices</p>
          <h2 className="mt-3 font-serif text-4xl text-ink-900">What guests remember</h2>
        </div>
        {avg !== null && (
          <div className="flex items-center gap-2">
            <Stars value={Math.round(avg)} />
            <span className="text-sm text-ink-900/60">
              {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-900/50">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="rounded-2xl border border-ink-900/5 bg-cream-100 p-8 text-sm text-ink-900/60">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {reviews.slice(0, 6).map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-ink-900/5 bg-cream-50 p-6"
            >
              <Stars value={r.rating} />
              <p className="mt-4 text-sm leading-relaxed text-ink-900/80">{r.comment}</p>
              <p className="mt-4 text-[10px] uppercase tracking-widest text-ink-900/40">
                {r.user_name ?? "Verified guest"}
              </p>
            </li>
          ))}
        </ul>
      )}

      {isAuthenticated && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) {
              toast.error("Add a short comment before submitting.");
              return;
            }
            mutation.mutate();
          }}
          className="mt-10 rounded-3xl border border-ink-900/5 bg-cream-50 p-6"
        >
          <p className="font-serif text-2xl text-ink-900">Share your journey</p>
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                aria-label={`Rate ${v} of 5`}
                onClick={() => setRating(v)}
                className="p-1"
              >
                <Star
                  className={cn(
                    "size-6",
                    v <= rating ? "fill-ink-900 text-ink-900" : "text-ink-900/25",
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="What made this journey memorable?"
            className="mt-4 w-full rounded-2xl border border-ink-900/10 bg-cream-50 p-4 text-sm text-ink-900 placeholder:text-ink-900/40 focus:border-ink-900/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-4 rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-50"
          >
            {mutation.isPending ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= value ? "fill-ink-900 text-ink-900" : "text-ink-900/20",
          )}
        />
      ))}
    </div>
  );
}