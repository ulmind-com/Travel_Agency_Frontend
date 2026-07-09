import { createFileRoute, Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

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

  return (
    <div className="pt-24 pb-24">
      <Container className="max-w-2xl text-center">
        <FadeUp>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Booking confirmed
          </p>
          <h1 className="mt-4 font-serif text-5xl italic text-ink-900">
            Your journey awaits.
          </h1>
          <p className="mt-4 text-sm text-ink-900/60">
            A confirmation and dossier will arrive shortly. Present this QR at
            check-in.
          </p>

          <div className="mx-auto mt-10 flex w-full max-w-sm flex-col items-center rounded-3xl border border-ink-900/5 bg-cream-50 p-8">
            {qr ? (
              <img
                src={qr}
                alt="Booking QR code"
                width={240}
                height={240}
                className="size-60"
              />
            ) : (
              <div className="size-60 animate-pulse rounded-2xl bg-cream-100" />
            )}
            <p className="mt-6 text-[10px] uppercase tracking-widest text-ink-900/40">
              Reference
            </p>
            <p className="mt-1 font-mono text-sm text-ink-900">{bookingId}</p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/account/bookings"
              className="rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50"
            >
              View my bookings
            </Link>
            <Link
              to="/packages"
              className="rounded-full border border-ink-900/15 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-ink-900"
            >
              Explore more escapes
            </Link>
          </div>
        </FadeUp>
      </Container>
    </div>
  );
}