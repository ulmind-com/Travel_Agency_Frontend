import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import { mediaService } from "@/services/media.service";
import {
  defaultRecentGallery,
  recentGalleryService,
  type GallerySlot,
  type RecentGalleryContent,
} from "@/services/recent-gallery.service";

export const Route = createFileRoute(
  "/_authenticated/account/admin/recent-gallery",
)({
  head: () => ({
    meta: [
      { title: "Recent gallery — Admin · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRecentGalleryPage,
});

function AdminRecentGalleryPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [c, setC] = useState<RecentGalleryContent>(defaultRecentGallery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/account", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    let alive = true;
    recentGalleryService.get().then((s) => {
      if (alive) setC(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="grid min-h-[40vh] place-items-center px-6">
        <p className="text-sm text-ink-900/50">Checking access…</p>
      </div>
    );
  }

  const patch = (p: Partial<RecentGalleryContent>) =>
    setC((s) => ({ ...s, ...p }));
  const updateSlot = (id: string, p: Partial<GallerySlot>) =>
    setC((s) => ({
      ...s,
      slots: s.slots.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  const save = async () => {
    setSaving(true);
    try {
      await recentGalleryService.save(c);
      await qc.invalidateQueries({ queryKey: ["recent-gallery"] });
      toast.success("Recent gallery published");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    const fresh = await recentGalleryService.reset();
    setC(fresh);
    await qc.invalidateQueries({ queryKey: ["recent-gallery"] });
    toast.success("Reset to defaults");
  };

  const positionLabel = (i: number) =>
    [
      "Top left",
      "Center (offset)",
      "Top right",
      "Bottom left",
      "Bottom right",
    ][i] ?? `Slot ${i + 1}`;

  return (
    <div className="admin-studio">
      <Container className="py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Admin · Homepage
            </p>
            <h1 className="font-serif text-4xl text-ink-900 lg:text-5xl">
              Recent gallery
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-900/60">
              Upload the five images used in the Recent Gallery collage on the
              homepage. Each slot maps to a fixed position in the layout.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-4 py-2 text-[12px] uppercase tracking-widest text-ink-900/70 hover:bg-ink-900/5"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-2 text-[12px] uppercase tracking-widest text-cream-50 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Publish
            </button>
          </div>
        </div>

        <section className="mb-10 grid gap-4 rounded-3xl border border-ink-900/10 bg-white p-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
              Eyebrow
            </span>
            <input
              value={c.eyebrow}
              onChange={(e) => patch({ eyebrow: e.target.value })}
              className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
              Title
            </span>
            <input
              value={c.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
            />
          </label>
        </section>

        <section>
          <h2 className="mb-4 font-serif text-2xl text-ink-900">Slots</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.slots.map((slot, i) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                position={positionLabel(i)}
                index={i + 1}
                onChange={(p) => updateSlot(slot.id, p)}
              />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

function SlotCard({
  slot,
  position,
  index,
  onChange,
}: {
  slot: GallerySlot;
  position: string;
  index: number;
  onChange: (p: Partial<GallerySlot>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const media = await mediaService.upload(file);
      onChange({ imageUrl: media.url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-ink-900/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-ink-900/50">
          Slot {index} · {position}
        </span>
        {slot.imageUrl && (
          <button
            type="button"
            onClick={() => onChange({ imageUrl: "" })}
            className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-2 py-1 text-[10px] uppercase tracking-widest text-destructive"
          >
            <Trash2 className="size-3" />
            Clear
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-ink-900/5"
      >
        {slot.imageUrl ? (
          <img
            src={slot.imageUrl}
            alt={slot.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[11px] uppercase tracking-widest text-ink-900/40">
            <ImagePlus className="mx-auto mb-1 size-4" />
            Upload
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-ink-900/40 text-cream-50">
            <Loader2 className="size-5 animate-spin" />
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.target.value = "";
          }}
        />
      </button>
      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
          Alt text
        </span>
        <input
          value={slot.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
        />
      </label>
    </div>
  );
}