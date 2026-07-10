import { Link } from "@tanstack/react-router";

import footerBg from "@/assets/footer-landscape.png.asset.json";

export function Footer() {
  return (
    <footer
      className="relative isolate w-full bg-[#0d2b2b] bg-cover bg-top bg-no-repeat text-white"
      style={{
        backgroundImage: `url(${footerBg.url})`,
        aspectRatio: "1920 / 1200",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 top-[52%] flex flex-col justify-between px-[3%] pb-[2.5%] pt-[1%]">
        <div className="grid grid-cols-3 gap-[3%]">
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

        <div className="flex flex-col items-start justify-between gap-2 text-[10px] text-white/70 sm:text-xs md:flex-row md:items-center">
          <span>
            &copy; {new Date().getFullYear()} Ulmind Travel · Curating high-fidelity journeys
          </span>
          <span className="opacity-80">Crafted with intention · Made in India</span>
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
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.25em] text-white/60 sm:mb-4 sm:text-[11px]">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-white sm:gap-x-6 sm:gap-y-2 sm:text-sm">
        {columns.map((col, i) => (
          <ul key={i} className="space-y-1 sm:space-y-2">
            {col.map((it) => (
              <li key={it.label}>
                <Link
                  to={it.to}
                  search={it.search as never}
                  className="transition-colors hover:text-white/80"
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
