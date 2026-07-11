import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { apiErrorMessage } from "@/lib/api";
import { env } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/format";
import { packageDetailQuery } from "@/lib/queries";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAuth } from "@/lib/auth-context";
import { bookingsService } from "@/services/bookings.service";
import { inventoryService } from "@/services/inventory.service";
import { paymentsService } from "@/services/payments.service";

const SearchSchema = z.object({
  date: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(20).default(2),
});

export const Route = createFileRoute("/_authenticated/book/$id")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Reserve your escape · Ulmind" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(packageDetailQuery(params.id)),
  component: BookingPage,
});

function BookingPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: pkg } = useSuspenseQuery(packageDetailQuery(id));
  const { user } = useAuth();

  const [date, setDate] = useState<string>(search.date ?? "");
  const [guests, setGuests] = useState<number>(search.guests ?? 2);
  const [promo, setPromo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const price = pkg.discounted_price ?? pkg.base_price;
  const tax = (price * (pkg.tax_percent ?? 0)) / 100;
  const total = (price + tax) * guests;

  const handleBook = async () => {
    if (!date) {
      toast.error("Choose a travel date to continue");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Lock seats
      const lock = await inventoryService.lockSeats(id, guests);
      // 2. Initiate Razorpay order
      const order = await paymentsService.initiate(
        {
          package_id: id,
          travel_start_date: new Date(date).toISOString(),
          travelers_count: guests,
          applied_promo_code: promo || undefined,
        },
        lock.lock_id,
      );

      // 3. Open Razorpay
      await openRazorpayCheckout({
        key: order.key_id ?? env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpay_order_id,
        name: "Ulmind Travel",
        description: pkg.title,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone_number ?? undefined,
        },
        theme: { color: "#1c1917" },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setSubmitting(false);
          },
        },
        handler: async (resp) => {
          try {
            await paymentsService.verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              lock_id: lock.lock_id,
            });
            // 4. Create booking record (server may auto-create on verify;
            // safe to attempt — if it 409s we still redirect to bookings).
            let bookingId: string | undefined;
            try {
              const booking = await bookingsService.create(
                {
                  package_id: id,
                  travel_start_date: new Date(date).toISOString(),
                  travelers_count: guests,
                  applied_promo_code: promo || undefined,
                },
                lock.lock_id,
              );
              bookingId = booking.id;
            } catch {
              /* verify may have created the booking already */
            }
            toast.success("Booking confirmed");
            navigate({
              to: "/book/success/$bookingId",
              params: { bookingId: bookingId ?? lock.lock_id },
            });
          } catch (err) {
            toast.error(apiErrorMessage(err, "Payment verification failed"));
            setSubmitting(false);
          }
        },
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not start payment"));
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 pb-16 sm:pt-24 sm:pb-24">
      <Container>
        <FadeUp>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Reserve</p>
          <h1 className="mt-3 font-serif text-2xl text-ink-900 sm:text-4xl md:text-5xl">{pkg.title}</h1>
        </FadeUp>

        <div className="mt-8 grid gap-8 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className="min-w-0 space-y-6 sm:space-y-8">
            <section className="rounded-3xl border border-ink-900/5 bg-cream-50 p-4 sm:p-6">
              <h2 className="font-serif text-2xl text-ink-900">1 · Travel details</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-ink-900/50">Departure</span>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm text-ink-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-ink-900/50">Travelers</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm text-ink-900 focus:outline-none"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-ink-900/5 bg-cream-50 p-6">
              <h2 className="font-serif text-2xl text-ink-900">2 · Promo code</h2>
              <div className="mt-4 flex gap-3">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm uppercase tracking-widest text-ink-900 focus:outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-ink-900/50">
                Codes are validated at payment.
              </p>
            </section>

            <section className="rounded-3xl border border-ink-900/5 bg-cream-50 p-6">
              <h2 className="font-serif text-2xl text-ink-900">3 · Confirm & pay</h2>
              <p className="mt-2 text-sm text-ink-900/60">
                You&apos;ll be redirected to a secure Razorpay checkout.
              </p>
              <button
                type="button"
                onClick={handleBook}
                disabled={submitting || !date}
                className="mt-6 w-full rounded-full bg-ink-900 py-4 text-[12px] font-medium uppercase tracking-widest text-cream-50 ring-1 ring-ink-900 disabled:opacity-50"
              >
                {submitting ? "Processing…" : `Pay ${formatCurrency(total, pkg.currency ?? "INR")}`}
              </button>
            </section>
          </div>

          <aside className="rounded-3xl border border-ink-900/5 bg-cream-50 p-6">
            <p className="text-[11px] uppercase tracking-widest text-ink-900/40">Summary</p>
            <p className="mt-4 font-serif text-2xl text-ink-900">{pkg.title}</p>
            <p className="mt-1 text-xs text-ink-900/60">
              {pkg.duration_nights} nights · {pkg.destinations.join(" · ")}
            </p>
            <div className="mt-6 space-y-2 border-t border-ink-900/5 pt-6 text-sm text-ink-900/70">
              <Row label="Departure" value={date ? formatDate(date) : "—"} />
              <Row label="Guests" value={String(guests)} />
              <Row label={`Base × ${guests}`} value={formatCurrency(price * guests, pkg.currency)} />
              {pkg.tax_percent ? (
                <Row label={`Taxes (${pkg.tax_percent}%)`} value={formatCurrency(tax * guests, pkg.currency)} />
              ) : null}
              <Row label="Total" value={formatCurrency(total, pkg.currency)} bold />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={"flex items-center justify-between " + (bold ? "font-medium text-ink-900" : "")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}