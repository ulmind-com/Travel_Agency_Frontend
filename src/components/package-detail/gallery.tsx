import { useState } from "react";

import type { CloudinaryMedia } from "@/types/api";
import { cn } from "@/lib/utils";

type Props = {
  images: CloudinaryMedia[];
  fallback: CloudinaryMedia;
  title: string;
};

export function Gallery({ images, fallback, title }: Props) {
  const all = images.length ? images : [fallback];
  const [active, setActive] = useState(0);
  const current = all[active] ?? fallback;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_120px]">
      <div className="relative overflow-hidden rounded-3xl bg-cream-100 ring-1 ring-black/5" style={{ aspectRatio: "16/10" }}>
        <img
          src={current.url}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      </div>
      {all.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
          {all.map((img, i) => (
            <button
              key={img.public_id + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 overflow-hidden rounded-2xl ring-1 transition-all",
                active === i
                  ? "ring-ink-900 ring-2"
                  : "ring-black/10 opacity-70 hover:opacity-100",
              )}
              style={{ width: 96, height: 96 }}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}