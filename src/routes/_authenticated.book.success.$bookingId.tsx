import { createFileRoute, Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { useEffect, useState, useRef } from "react";
import {
  Calendar,
  Check,
  Download,
  MapPin,
  PartyPopper,
  Ticket,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";

export const Route = createFileRoute("/_authenticated/book/success/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking confirmed · Ulmind" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { bookingId } = Route.useParams();
  const [qr, setQr] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const filter = (node: HTMLElement) => {
        return !node.classList?.contains("download-button-wrapper");
      };
      const url = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2, 
        backgroundColor: "#ffffff",
        filter: filter 
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `ulmind-ticket-${bookingId}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to download card", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(bookingId, {
      margin: 1,
      width: 320,
      color: { dark: "#1c1917", light: "#fdfcf7" },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-cream-50 to-emerald-50/30 pt-24 pb-24">
      {/* Confetti-like celebration dots */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce rounded-full"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                left: `${Math.random() * 100}%`,
                top: `${-10 + Math.random() * 60}%`,
                backgroundColor: [
                  "#1c1917",
                  "#b8860b",
                  "#10b981",
                  "#6366f1",
                  "#f59e0b",
                  "#ec4899",
                ][Math.floor(Math.random() * 6)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}

      <Container className="max-w-2xl text-center">
        <FadeUp>
          {/* Success icon */}
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.5)]">
            <Check className="size-10 text-white" strokeWidth={2.5} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[10px] uppercase tracking-widest text-emerald-700">
            <PartyPopper className="size-3" />
            Payment successful
          </div>

          <h1 className="mt-6 font-serif text-4xl italic text-ink-900 sm:text-5xl">
            Your journey awaits.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-900/60">
            A confirmation email with your booking dossier and invoice will arrive shortly.
            Present the QR code below at check-in.
          </p>

          {/* QR Card */}
          <div className="mx-auto mt-10 w-full max-w-sm">
            <div ref={cardRef} className="overflow-hidden rounded-3xl border border-ink-900/5 bg-white shadow-[0_30px_80px_-20px_rgba(28,25,23,0.15)]">
            <div className="bg-gradient-to-r from-ink-900 via-ink-800 to-ink-900 px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Ticket className="size-4 text-gold" />
                <span className="text-[10px] uppercase tracking-widest text-cream-50/80">
                  Boarding Pass
                </span>
              </div>
            </div>

            <div className="p-8">
              {qr ? (
                <img
                  src={qr}
                  alt="Booking QR code"
                  width={240}
                  height={240}
                  className="mx-auto size-60 rounded-2xl"
                />
              ) : (
                <div className="mx-auto size-60 animate-pulse rounded-2xl bg-cream-100" />
              )}

              <div className="mt-6 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-ink-900/40">
                  Booking Reference
                </p>
                <p className="font-mono text-lg font-medium tracking-wider text-ink-900">
                  {bookingId}
                </p>
              </div>

              {/* Quick info chips */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-ink-900/8 bg-cream-50 px-3 py-1 text-[10px] text-ink-900/60">
                  <Calendar className="size-2.5" />
                  Confirmed
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-ink-900/8 bg-cream-50 px-3 py-1 text-[10px] text-ink-900/60">
                  <MapPin className="size-2.5" />
                  E-ticket ready
                </div>
              </div>
            </div>

            {/* Download QR */}
            {qr && (
              <div className="download-button-wrapper border-t border-ink-900/5 px-6 py-3">
                <button
                  onClick={handleDownloadCard}
                  className="flex w-full items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-ink-900/50 transition-colors hover:text-ink-900"
                >
                  <Download className="size-3" />
                  Download Card
                </button>
              </div>
            )}
          </div>
          </div>

          {/* Action buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/account/bookings"
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-8 py-3.5 text-[12px] font-medium uppercase tracking-widest text-cream-50 shadow-[0_10px_30px_-10px_rgba(28,25,23,0.5)] transition-transform hover:scale-[1.02] active:scale-95"
            >
              View my bookings
            </Link>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-white px-8 py-3.5 text-[12px] font-medium uppercase tracking-widest text-ink-900 shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              Explore more escapes
            </Link>
          </div>
        </FadeUp>
      </Container>
    </div>
  );
}