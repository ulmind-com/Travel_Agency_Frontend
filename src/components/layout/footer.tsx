import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#0f2e2d] text-[#e8ede8]">
      {/* Landscape illustration */}
      <div className="relative w-full">
        <svg
          viewBox="0 0 1440 480"
          preserveAspectRatio="xMidYMax slice"
          className="block h-[280px] w-full sm:h-[360px] lg:h-[460px]"
          aria-hidden
        >
          <defs>
            <linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5efe0" />
              <stop offset="55%" stopColor="#e7e6d3" />
              <stop offset="100%" stopColor="#cfdad0" />
            </linearGradient>
            <filter id="fBlur" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* sky */}
          <rect width="1440" height="480" fill="url(#fSky)" />

          {/* far mountains */}
          <path
            fill="#b9cdc5"
            d="M0,230 L90,180 L160,210 L240,150 L320,200 L410,140 L500,195 L590,160 L690,205 L790,155 L880,200 L970,170 L1070,210 L1170,165 L1270,205 L1360,175 L1440,210 L1440,480 L0,480 Z"
          />

          {/* mid mountains */}
          <path
            fill="#7ea69e"
            d="M0,290 L70,250 L150,285 L230,220 L320,275 L410,215 L510,270 L610,235 L720,285 L820,245 L920,290 L1020,255 L1130,295 L1230,260 L1330,290 L1440,270 L1440,480 L0,480 Z"
          />

          {/* fog haze */}
          <rect
            x="0"
            y="270"
            width="1440"
            height="70"
            fill="#f5efe0"
            opacity="0.55"
            filter="url(#fBlur)"
          />

          {/* back tree line */}
          <g fill="#3f6a63" opacity="0.9">
            {Array.from({ length: 30 }).map((_, i) => {
              const x = i * 50 + 10;
              const h = 30 + ((i * 37) % 25);
              const base = 320;
              return (
                <polygon
                  key={i}
                  points={`${x},${base} ${x + 10},${base - h} ${x + 20},${base}`}
                />
              );
            })}
          </g>

          {/* lake / water hint */}
          <path
            fill="#c9d8d0"
            opacity="0.7"
            d="M520,335 Q720,325 940,335 L940,355 Q720,362 520,355 Z"
          />

          {/* front hill */}
          <path
            fill="#1f4442"
            d="M0,395 C160,340 320,410 500,380 C640,355 780,395 920,360 C1080,320 1240,395 1440,355 L1440,480 L0,480 Z"
          />

          {/* pine cluster left */}
          <g fill="#0e2b2a">
            {[80, 130, 175, 220, 265, 305].map((x, i) => {
              const h = 90 + (i % 3) * 25;
              const baseY = 400 + (i % 2) * 8;
              return (
                <polygon
                  key={x}
                  points={`${x - 14},${baseY} ${x},${baseY - h} ${x + 14},${baseY}`}
                />
              );
            })}
          </g>

          {/* tall pine right */}
          <g fill="#0e2b2a">
            <polygon points="1300,395 1320,275 1340,395" />
            <polygon points="1290,395 1320,300 1350,395" />
            <rect x="1317" y="390" width="6" height="20" />
          </g>

          {/* family silhouette on right hill */}
          <g fill="#0e2b2a" transform="translate(1050 320)">
            {/* dad */}
            <circle cx="0" cy="0" r="6" />
            <path d="M-7,6 L7,6 L10,42 L-10,42 Z" />
            {/* mom */}
            <circle cx="22" cy="4" r="5.5" />
            <path d="M15,10 L29,10 L32,44 L12,44 Z" />
            {/* child 1 */}
            <circle cx="42" cy="14" r="4" />
            <path d="M37,18 L47,18 L49,44 L35,44 Z" />
            {/* child 2 */}
            <circle cx="-14" cy="12" r="3.5" />
            <path d="M-18,15 L-10,15 L-8,42 L-20,42 Z" />
          </g>
        </svg>

        {/* wordmark subtly on hill */}
        <p className="pointer-events-none absolute left-6 bottom-4 font-serif text-2xl text-[#e8ede8]/70 sm:left-10 sm:text-3xl lg:left-16">
          Ulmind Travel
        </p>
      </div>

      {/* link band */}
      <div className="border-t border-white/5 bg-[#0f2e2d]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
          <div className="grid gap-10 md:grid-cols-3 lg:gap-16">
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

          <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.2em] text-[#8fb5b0] md:flex-row md:items-center">
            <span>
              &copy; {new Date().getFullYear()} Ulmind Travel · Crafted with intention
            </span>
            <span>Curating high-fidelity journeys</span>
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
      <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.25em] text-[#8fb5b0]">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-[#e8ede8]/85">
        {columns.map((col, i) => (
          <ul key={i} className="space-y-3">
            {col.map((it) => (
              <li key={it.label}>
                <Link
                  to={it.to}
                  search={it.search as never}
                  className="transition-colors hover:text-white"
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