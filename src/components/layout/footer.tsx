import { Link } from "@tanstack/react-router";

import { Container } from "./container";

export function Footer() {
  return (
    <footer className="border-t border-ink-900/5 bg-cream-100">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-3xl text-ink-900">Ulmind Travel</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-900/60">
              Curating high-fidelity journeys for the discerning few — from
              Kyoto's stillness to the fjords of the Arctic Circle.
            </p>
          </div>
          <FooterCol
            title="Explore"
            items={[
              { to: "/packages", label: "All escapes" },
              { to: "/packages", label: "Destinations", search: { category: "BEACH" as const } },
              { to: "/packages", label: "Honeymoon", search: { category: "HONEYMOON" as const } },
              { to: "/packages", label: "Adventure", search: { category: "ADVENTURE" as const } },
            ]}
          />
          <FooterCol
            title="Company"
            items={[
              { to: "/about", label: "The Journal" },
              { to: "/contact", label: "Contact" },
              { to: "/account", label: "My account" },
            ]}
          />
          <FooterCol
            title="Legal"
            items={[
              { to: "/", label: "Privacy" },
              { to: "/", label: "Terms" },
              { to: "/", label: "Cancellation" },
            ]}
          />
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ink-900/5 pt-8 text-[11px] uppercase tracking-widest text-ink-900/40 md:flex-row">
          <span>&copy; {new Date().getFullYear()} Ulmind Travel Group</span>
          <span>Crafted with intention · Made in India</span>
        </div>
      </Container>
    </footer>
  );
}

type Item = { to: string; label: string; search?: Record<string, string> };

function FooterCol({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-900/40">
        {title}
      </p>
      <ul className="space-y-3 text-sm text-ink-900/70">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              to={it.to}
              search={it.search as never}
              className="transition-colors hover:text-ink-900"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}