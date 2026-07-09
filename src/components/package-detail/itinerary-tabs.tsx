import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ItineraryDay } from "@/types/api";

export function ItineraryTabs({ days }: { days: ItineraryDay[] }) {
  const [active, setActive] = useState(0);
  if (!days.length) return null;
  const current = days[active];
  return (
    <div>
      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto border-b border-ink-900/10">
        {days.map((d, i) => (
          <button
            key={d.day_number}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-[12px] font-medium uppercase tracking-widest transition-colors",
              active === i
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-900/40 hover:text-ink-900/70",
            )}
          >
            Day {d.day_number}
          </button>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            {current.timing_details}
          </p>
          <h3 className="mt-3 font-serif text-3xl text-ink-900">{current.title}</h3>
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink-900/70">
            {current.plan_description}
          </p>
        </div>
        {current.day_image?.url && (
          <div
            className="overflow-hidden rounded-2xl bg-cream-100"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src={current.day_image.url}
              alt={current.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}