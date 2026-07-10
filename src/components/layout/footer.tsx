import { Link } from "@tanstack/react-router";

import footerBg from "@/assets/footer-landscape.png.asset.json";

export function Footer() {
  return (
    <footer className="relative m-0 block w-full bg-[#0d2b2b] p-0 text-white">
      <div className="relative w-full">
        <img
          src={footerBg.url}
          alt=""
          className="block w-full select-none"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cream-50 to-transparent sm:h-40 lg:h-48"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d2b2b] to-transparent sm:h-32 lg:h-40"
          aria-hidden="true"
        />
      </div>

      <div className="bg-[#0d2b2b]">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-4 lg:px-10 lg:pb-14">
          <p className="mb-8 font-serif text-3xl text-white/90 lg:text-4xl">
            Ulmind Travel
          </p>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 lg:gap-16">
            <FooterGroup
              title="Learn"
              columns={[
                [
                  { to: "/packages", label: "All escapes" },
                  { to: "/packages", label: "Destinations" },
                  { to: "/packages", label: "Honeymoon" },
                ],
                [
                  { to: "/packages", label: "Adventure" },
                  { to: "/blogs", label: "Journal" },
                ],
              ]}
            />
            <FooterGroup
              title="General"
              columns={[
                [
                  { to: "/about", label: "About Us" },
                  { to: "/contact", label: "Contact" },
                  { to: "/account", label: "My account" },
                ],
                [
                  { to: "/gallery", label: "Gallery" },
                  { to: "/blogs", label: "Blog" },
                ],
              ]}
            />
            <FooterGroup
              title="Resources"
              columns={[
                [
                  { to: "/", label: "Privacy" },
                  { to: "/", label: "Terms" },
                ],
                [
                  { to: "/", label: "Cancellation" },
                  { to: "/contact", label: "Support" },
                ],
              ]}
            />
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center">
            <span>
              &copy; {new Date().getFullYear()} Ulmind Travel · Crafted with intention
            </span>
            <span className="opacity-80">Curating high-fidelity journeys</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

type Item = { to: string; label: string; search?: Record<string, string> };

function FooterGroup({
  title,
  columns,
}: {
  title: string;
  columns: Item[][];
}) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-white/55">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-white">
        {columns.map((col, i) => (
          <ul key={i} className="space-y-2">
            {col.map((it) => (
              <li key={it.label}>
                <Link
                  to={it.to}
                  search={it.search as never}
                  className="transition-colors hover:text-white/70"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
