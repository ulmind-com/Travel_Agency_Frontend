import { Link } from "@tanstack/react-router";

import footerBg from "@/assets/footer-landscape.png.asset.json";

export function Footer() {
  return (
    <footer className="relative isolate w-full bg-[#0d2b2b] text-white">
      {/* Landscape illustration — show only the top ~55% (sky + mountains + hill), hide baked-in text */}
      <div
        aria-hidden
        className="w-full bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: `url(${footerBg.url})`,
          aspectRatio: "1920 / 660",
        }}
      />

      {/* Link band — solid teal that matches the hill */}
      <div className="bg-[#0d2b2b]">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-8 lg:px-10 lg:pb-14 lg:pt-10">
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

          <div className="mt-10 flex flex-col items-start justify-between gap-2 text-xs text-white/60 md:flex-row md:items-center">
            <span>
              &copy; {new Date().getFullYear()} Ulmind Travel · Curating high-fidelity journeys
            </span>
            <span className="opacity-80">Crafted with intention · Made in India</span>
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
