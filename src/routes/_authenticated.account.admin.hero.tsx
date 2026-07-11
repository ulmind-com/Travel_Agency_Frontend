import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import {
  defaultHeroSlides,
  heroSlidesService,
  type HeroSlide,
} from "@/services/hero-slides.service";
import { mediaService } from "@/services/media.service";

export const Route = createFileRoute("/_authenticated/account/admin/hero")({
  head: () => ({
    meta: [
      { title: "Hero slides — Admin · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHeroPage,
});

function AdminHeroPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/account", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    let alive = true;
    heroSlidesService.list().then((s) => {
      if (alive) setSlides(s);
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

  const update = (id: string, patch: Partial<HeroSlide>) =>
    setSlides((s) => s.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const remove = (id: string) =>
    setSlides((s) => s.filter((row) => row.id !== id));

  const addBlank = () =>
    setSlides((s) => [
      ...s,
      {
        id: "slide-" + Math.random().toString(36).slice(2, 9),
        imageUrl: "",
        eyebrow: "New collection",
        headlinePrefix: "Somewhere",
        headlineAccent: "unexpected.",
        subtitle: "A short editorial line about this new destination.",
      },
    ]);

  const move = (id: string, dir: -1 | 1) =>
    setSlides((s) => {
      const i = s.findIndex((r) => r.id === id);
      if (i < 0) return s;
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = slides.filter((s) => s.imageUrl);
      await heroSlidesService.save(cleaned);
      await qc.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("Hero slides published");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save slides"));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    const fresh = await heroSlidesService.reset();
    setSlides(fresh);
    await qc.invalidateQueries({ queryKey: ["hero-slides"] });
    toast.success("Reset to curated defaults");
  };

  const restoreDefaults = () => setSlides(defaultHeroSlides);

  return (
    <div className="admin-studio">
      <Container className="py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Admin · Homepage
            </p>
            <h1 className="font-serif text-4xl text-ink-900 lg:text-5xl">
              Hero slides
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-900/60">
              Upload the destination photographs and editorial copy that
              rotate across the homepage hero. Changes publish instantly to
              every visitor.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={restoreDefaults}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-4 py-2 text-[12px] uppercase tracking-widest text-ink-900/70 hover:bg-ink-900/5"
            >
              <RotateCcw className="size-3.5" /> Load defaults
            </button>
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

        <div className="space-y-4">
          {slides.map((s, i) => (
            <SlideRow
              key={s.id}
              index={i}
              total={slides.length}
              slide={s}
              onChange={(patch) => update(s.id, patch)}
              onRemove={() => remove(s.id)}
              onMove={(dir) => move(s.id, dir)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addBlank}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-dashed border-ink-900/30 px-5 py-3 text-[12px] uppercase tracking-widest text-ink-900/70 hover:bg-ink-900/5"
        >
          <ImagePlus className="size-3.5" /> Add slide
        </button>
      </Container>
    </div>
  );
}

function SlideRow({
  index,
  total,
  slide,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  total: number;
  slide: HeroSlide;
  onChange: (patch: Partial<HeroSlide>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
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
    <div className="grid gap-4 rounded-3xl border border-ink-900/10 bg-white p-4 lg:grid-cols-[220px_1fr_auto]">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-ink-900/5"
      >
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[11px] uppercase tracking-widest text-ink-900/40">
            <ImagePlus className="mx-auto mb-1 size-4" />
            Upload image
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

      <div className="grid gap-3">
        <Field label="Eyebrow" value={slide.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Headline"
            value={slide.headlinePrefix}
            onChange={(v) => onChange({ headlinePrefix: v })}
          />
          <Field
            label="Italic accent"
            value={slide.headlineAccent}
            onChange={(v) => onChange({ headlineAccent: v })}
          />
        </div>
        <Field
          label="Subtitle"
          value={slide.subtitle}
          onChange={(v) => onChange({ subtitle: v })}
          textarea
        />
      </div>

      <div className="flex flex-row items-start justify-end gap-2 lg:flex-col">
        <span className="rounded-full bg-ink-900/5 px-3 py-1 text-[11px] uppercase tracking-widest text-ink-900/50">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="rounded-full border border-ink-900/10 px-3 py-1 text-[11px] uppercase tracking-widest text-ink-900/70 disabled:opacity-30"
        >
          Up
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="rounded-full border border-ink-900/10 px-3 py-1 text-[11px] uppercase tracking-widest text-ink-900/70 disabled:opacity-30"
        >
          Down
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-3 py-1 text-[11px] uppercase tracking-widest text-destructive"
        >
          <Trash2 className="size-3" /> Remove
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const shared =
    "w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none";
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
        {label}
      </span>
      {textarea ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      )}
    </label>
  );
}