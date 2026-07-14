import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Shield,
  Sparkles,
  Tag,
  Users,
  Zap,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { api, apiErrorMessage } from "@/lib/api";
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

type Step = "details" | "review" | "processing" | "done";

function BookingPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: pkg } = useSuspenseQuery(packageDetailQuery(id));
  const { user } = useAuth();

  const [date, setDate] = useState<string>(search.date ?? "");
  const [guests, setGuests] = useState<number>(search.guests ?? 2);
  type Traveler = { name: string; traveler_type: string; email?: string; phone?: string; photo: File | null; documents: Record<string, File> };
  const [travelers, setTravelers] = useState<Traveler[]>(
    Array.from({ length: search.guests ?? 2 }).map((_, i) => ({
      name: i === 0 ? (user?.name || "") : "",
      traveler_type: "ADULT",
      email: i === 0 ? (user?.email || "") : "",
      phone: i === 0 ? (user?.phone_number || "") : "",
      photo: null,
      documents: {},
    }))
  );
  
  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === guests) return prev;
      if (prev.length > guests) return prev.slice(0, guests);
      const toAdd = guests - prev.length;
      return [...prev, ...Array.from({ length: toAdd }).map(() => ({ name: "", traveler_type: "ADULT", photo: null as File | null, documents: {} }))];
    });
  }, [guests]);

  const [promo, setPromo] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  const price = pkg.discounted_price ?? pkg.base_price;
  const tax = (price * (pkg.tax_percent ?? 0)) / 100;
  const total = (price + tax) * guests;

  // Countdown timer effect when processing
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown]);

  const handleBook = async () => {
    if (!date) {
      toast.error("Choose a travel date to continue");
      return;
    }
    if (travelers.some((t) => !t.name.trim())) {
      toast.error("Please provide names for all travelers");
      return;
    }
    setSubmitting(true);
    setStep("processing");
    try {
      // 1. Lock seats
      const lock = await inventoryService.lockSeats(id, guests);
      setLockCountdown(600); // 10 minutes

      // 2. Initiate Razorpay order — build FormData directly to guarantee files are attached
      const form = new FormData();
      form.append("booking_data", JSON.stringify({
        package_id: id,
        travel_start_date: new Date(date).toISOString(),
        travelers: travelers.map(({ name, traveler_type, email, phone }) => ({ name, traveler_type, email, phone })),
        promo_code: promo || undefined,
      }));
      form.append("lock_id", lock.lock_id);
      
      // Attach traveler photos & documents directly
      travelers.forEach((t, i) => {
        if (t.photo) form.append(`traveler_${i}_photo`, t.photo);
        if (t.documents) {
          Object.entries(t.documents).forEach(([docName, file]) => {
            if (file) form.append(`traveler_${i}_doc_${docName}`, file);
          });
        }
      });

      const { data: order } = await api.post<{ razorpay_order_id: string; amount_paise: number; currency: string; razorpay_key_id?: string }>("/payments/initiate", form);

      const razorpayKey = order.razorpay_key_id ?? env.RAZORPAY_KEY_ID;

      // 3. Open Razorpay with all payment methods enabled
      await openRazorpayCheckout({
        key: razorpayKey,
        amount: order.amount_paise,
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
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
          qr: true,
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled — your seats are still held for 10 minutes");
            setStep("review");
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
              package_id: id,
            });
            setStep("done");
            toast.success("Booking confirmed! 🎉");
            setTimeout(() => {
              navigate({
                to: "/book/success/$bookingId",
                params: { bookingId: lock.lock_id },
              });
            }, 1200);
          } catch (err) {
            toast.error(apiErrorMessage(err, "Payment verification failed"));
            setStep("review");
            setSubmitting(false);
          }
        },
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not start payment"));
      setStep("details");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-cream-50 to-cream-100/50 pt-20 pb-16 sm:pt-24 sm:pb-24">
      <Container>
        <FadeUp>
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate({ to: "/packages/$id", params: { id } })}
            className="group mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink-900/50 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to package
          </button>

          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Secure checkout
          </p>
          <h1 className="mt-3 font-serif text-2xl text-ink-900 sm:text-4xl md:text-5xl">
            {pkg.title}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-900/60">
            <MapPin className="size-3.5" />
            {pkg.destinations.join(" · ")} · {pkg.duration_nights} nights
          </p>
        </FadeUp>

        {/* Progress Steps */}
        <div className="mt-8 mb-10">
          <div className="flex items-center gap-0">
            {(["details", "review", "processing"] as const).map((s, i) => {
              const labels = ["Travel details", "Review & Pay", "Processing"];
              const icons = [Calendar, CreditCard, Zap];
              const Icon = icons[i];
              const isActive = step === s;
              const isDone =
                (s === "details" && (step === "review" || step === "processing" || step === "done")) ||
                (s === "review" && (step === "processing" || step === "done")) ||
                (s === "processing" && step === "done");
              return (
                <div key={s} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={
                        "grid size-8 place-items-center rounded-full text-xs font-medium transition-all duration-500 " +
                        (isDone
                          ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          : isActive
                            ? "bg-ink-900 text-cream-50 shadow-[0_0_20px_rgba(28,25,23,0.3)]"
                            : "border border-ink-900/15 bg-white text-ink-900/40")
                      }
                    >
                      {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                    </div>
                    <span
                      className={
                        "hidden text-xs uppercase tracking-wider sm:inline " +
                        (isActive || isDone ? "text-ink-900" : "text-ink-900/40")
                      }
                    >
                      {labels[i]}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={
                        "mx-3 h-px w-8 sm:w-12 transition-all duration-500 " +
                        (isDone ? "bg-emerald-500" : "bg-ink-900/10")
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          {/* Left side — forms */}
          <div className="min-w-0 space-y-6 sm:space-y-8">
            {/* Step 1: Travel Details */}
            <section
              className={
                "overflow-hidden rounded-3xl border bg-white/80 backdrop-blur-xl transition-all duration-500 " +
                (step === "details"
                  ? "border-ink-900/10 p-6 shadow-[0_20px_60px_-20px_rgba(28,25,23,0.1)] sm:p-8"
                  : "border-ink-900/5 p-5 opacity-70")
              }
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-full bg-ink-900/5">
                  <Calendar className="size-4 text-ink-900/60" />
                </div>
                <h2 className="font-serif text-xl text-ink-900 sm:text-2xl">Travel details</h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">
                    Departure date
                  </span>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-2xl border border-ink-900/10 bg-cream-50/50 px-4 py-3.5 text-sm text-ink-900 transition-shadow focus:border-ink-900/30 focus:shadow-[0_0_0_3px_rgba(28,25,23,0.05)] focus:outline-none"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">
                    Number of travelers
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-ink-900/10 bg-cream-50/50 px-4 py-3.5">
                    <Users className="size-4 text-ink-900/40" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={guests}
                      onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border-none bg-transparent p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
                    />
                    <span className="text-xs text-ink-900/40">guests</span>
                  </div>
                </label>
              </div>

              {/* Traveler Details Fields */}
              <div className="mt-8 space-y-4 border-t border-ink-900/5 pt-6">
                <h3 className="font-serif text-lg text-ink-900">Traveler Details</h3>
                <div className="space-y-4">
                  {travelers.map((t, i) => (
                    <div key={i} className="rounded-2xl border border-ink-900/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          placeholder={`Traveler ${i + 1} Name`}
                          value={t.name}
                          onChange={(e) => {
                            const newT = [...travelers];
                            newT[i].name = e.target.value;
                            setTravelers(newT);
                          }}
                          className="flex-1 rounded-2xl border border-ink-900/10 bg-cream-50/50 px-4 py-3 text-sm transition-shadow focus:border-ink-900/30 focus:shadow-[0_0_0_3px_rgba(28,25,23,0.05)] focus:outline-none"
                        />
                        <select
                          value={t.traveler_type}
                          onChange={(e) => {
                            const newT = [...travelers];
                            newT[i].traveler_type = e.target.value;
                            setTravelers(newT);
                          }}
                          className="w-full rounded-2xl border border-ink-900/10 bg-cream-50/50 px-4 py-3 text-sm transition-shadow focus:border-ink-900/30 focus:shadow-[0_0_0_3px_rgba(28,25,23,0.05)] focus:outline-none sm:w-32"
                        >
                          <option value="ADULT">Adult</option>
                          <option value="CHILD">Child</option>
                        </select>
                      </div>
                      
                      {/* File Uploads */}
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-900/20 bg-cream-50/50 px-4 py-3 text-sm text-ink-900/60 transition-colors hover:bg-cream-50 hover:border-ink-900/40">
                          <Camera className="size-4 shrink-0" />
                          <span className="truncate max-w-[120px] font-medium text-xs uppercase tracking-wider">{t.photo ? t.photo.name : "Photo"}</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const newT = [...travelers];
                                newT[i].photo = e.target.files[0];
                                setTravelers(newT);
                              }
                            }} 
                          />
                        </label>
                        
                        {pkg.required_traveler_documents?.map(doc => (
                          <label key={doc} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-900/20 bg-cream-50/50 px-4 py-3 text-sm text-ink-900/60 transition-colors hover:bg-cream-50 hover:border-ink-900/40">
                            <FileText className="size-4 shrink-0" />
                            <span className="truncate max-w-[120px] font-medium text-xs uppercase tracking-wider">{t.documents[doc] ? t.documents[doc].name : doc}</span>
                            <input 
                              type="file"
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  const newT = [...travelers];
                                  newT[i].documents[doc] = e.target.files[0];
                                  setTravelers(newT);
                                }
                              }} 
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {step === "details" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!date) {
                      toast.error("Please select a departure date");
                      return;
                    }
                    setStep("review");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-8 py-3.5 text-[12px] font-medium uppercase tracking-widest text-cream-50 transition-transform hover:scale-[1.02] active:scale-95"
                >
                  Continue to payment
                  <Sparkles className="size-3.5" />
                </button>
              )}
            </section>

            {/* Step 2: Promo & Payment */}
            {(step === "review" || step === "processing" || step === "done") && (
              <section className="overflow-hidden rounded-3xl border border-ink-900/10 bg-white/80 p-6 shadow-[0_20px_60px_-20px_rgba(28,25,23,0.1)] backdrop-blur-xl sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-full bg-ink-900/5">
                    <Tag className="size-4 text-ink-900/60" />
                  </div>
                  <h2 className="font-serif text-xl text-ink-900 sm:text-2xl">Promo code</h2>
                </div>
                <div className="mt-4 flex gap-3">
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    disabled={step === "processing" || step === "done"}
                    className="flex-1 rounded-2xl border border-ink-900/10 bg-cream-50/50 px-4 py-3 text-sm uppercase tracking-widest text-ink-900 transition-shadow focus:border-ink-900/30 focus:shadow-[0_0_0_3px_rgba(28,25,23,0.05)] focus:outline-none disabled:opacity-50"
                  />
                </div>
                <p className="mt-2 text-xs text-ink-900/50">
                  Codes are validated securely at payment time.
                </p>

                <div className="mt-8 border-t border-ink-900/5 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-full bg-ink-900/5">
                      <CreditCard className="size-4 text-ink-900/60" />
                    </div>
                    <h2 className="font-serif text-xl text-ink-900 sm:text-2xl">Secure payment</h2>
                  </div>
                  <p className="mt-3 text-sm text-ink-900/60">
                    You'll be redirected to Razorpay's PCI-DSS compliant checkout. Supports UPI, credit/debit cards, net banking, and wallets.
                  </p>

                  {/* Trust badges */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      { icon: Shield, label: "256-bit SSL" },
                      { icon: Lock, label: "PCI DSS" },
                      { icon: Zap, label: "Instant confirm" },
                    ].map((badge) => (
                      <div
                        key={badge.label}
                        className="flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1.5 text-[10px] uppercase tracking-wider text-emerald-700"
                      >
                        <badge.icon className="size-3" />
                        {badge.label}
                      </div>
                    ))}
                  </div>

                  {step === "processing" && lockCountdown > 0 && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <Clock className="size-4 text-amber-600" />
                      <p className="text-xs text-amber-700">
                        Seats locked for{" "}
                        <span className="font-mono font-medium">
                          {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, "0")}
                        </span>
                      </p>
                    </div>
                  )}

                  {step === "done" && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="grid size-8 place-items-center rounded-full bg-emerald-600 text-white">
                        <Check className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Payment successful!</p>
                        <p className="text-xs text-emerald-600">Redirecting to confirmation…</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={submitting || !date || step === "done"}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-ink-900 via-ink-800 to-ink-900 py-4 text-[13px] font-medium uppercase tracking-widest text-cream-50 shadow-[0_10px_30px_-10px_rgba(28,25,23,0.5)] transition-all hover:shadow-[0_15px_40px_-10px_rgba(28,25,23,0.6)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing payment…
                      </>
                    ) : step === "done" ? (
                      <>
                        <Check className="size-4" />
                        Confirmed
                      </>
                    ) : (
                      <>
                        <Lock className="size-3.5" />
                        Pay {formatCurrency(total, pkg.currency ?? "INR")} securely
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right side — Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-ink-900/5 bg-white/80 shadow-[0_30px_80px_-20px_rgba(28,25,23,0.15)] backdrop-blur-xl">
              {/* Thumbnail */}
              {pkg.thumbnail?.url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={pkg.thumbnail.url}
                    alt={pkg.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/70">
                      {pkg.category.toLowerCase()}
                    </p>
                    <p className="mt-1 font-serif text-lg text-white">{pkg.title}</p>
                  </div>
                </div>
              )}

              <div className="p-6">
                <p className="text-[11px] uppercase tracking-widest text-ink-900/40">
                  Booking summary
                </p>

                <div className="mt-4 space-y-3 text-sm text-ink-900/70">
                  <SummaryRow
                    icon={<Calendar className="size-3.5 text-ink-900/40" />}
                    label="Departure"
                    value={date ? formatDate(date) : "—"}
                  />
                  <SummaryRow
                    icon={<Users className="size-3.5 text-ink-900/40" />}
                    label="Travelers"
                    value={String(guests)}
                  />
                  <SummaryRow
                    icon={<MapPin className="size-3.5 text-ink-900/40" />}
                    label="Duration"
                    value={`${pkg.duration_days} days · ${pkg.duration_nights} nights`}
                  />
                </div>

                <div className="mt-5 space-y-2 border-t border-ink-900/5 pt-5 text-sm text-ink-900/70">
                  <Row label={`Base × ${guests}`} value={formatCurrency(price * guests, pkg.currency)} />
                  {pkg.tax_percent ? (
                    <Row label={`Taxes (${pkg.tax_percent}%)`} value={formatCurrency(tax * guests, pkg.currency)} />
                  ) : null}
                  {promo && (
                    <Row label="Promo" value={promo} />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink-900/10 pt-4">
                  <span className="text-sm font-medium text-ink-900">Total</span>
                  <span className="font-serif text-2xl text-ink-900">
                    {formatCurrency(total, pkg.currency ?? "INR")}
                  </span>
                </div>

                <p className="mt-4 text-center text-[9px] uppercase tracking-widest text-ink-900/35">
                  Secured by Razorpay · 256-bit encryption
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-ink-900">{value}</span>
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