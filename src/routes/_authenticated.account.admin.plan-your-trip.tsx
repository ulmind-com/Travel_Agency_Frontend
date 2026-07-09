import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import {
  defaultPlanYourTrip,
  planYourTripService,
  type PlanFeature,
  type PlanSlots,
  type PlanYourTripContent,
} from "@/services/plan-your-trip.service";
import { mediaService } from "@/services/media.service";
import {
  getPlanShapeClipStyle,
  PLAN_SHAPES,
  PlanShapeClipDefs,
  type PlanShapeKey,
} from "@/components/home/plan-your-trip";

export const Route = createFileRoute(
  "/_authenticated/account/admin/plan-your-trip",
)({
  head: () => ({
    meta: [
      { title: "Plan your trip — Admin · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPlanYourTripPage,
});

type SlotKey = keyof PlanSlots;

const SLOT_META: Record<
  SlotKey,
  { label: string; shape: PlanShapeKey }
> = {
  arch: { label: "Tall arch (left)", shape: "archTall" },
  circleA: { label: "D-shape (top right)", shape: "dRight" },
  circleB: { label: "Inverted arch (bottom right)", shape: "archBottom" },
};

function rid(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function AdminPlanYourTripPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [c, setC] = useState<PlanYourTripContent>(defaultPlanYourTrip);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/account", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    let alive = true;
    planYourTripService.get().then((s) => {
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

  const patch = (p: Partial<PlanYourTripContent>) =>
    setC((s: PlanYourTripContent) => ({ ...s, ...p }));

  const updateFeature = (id: string, p: Partial<PlanFeature>) =>
    setC((s: PlanYourTripContent) => ({
      ...s,
      features: s.features.map((f: PlanFeature) =>
        f.id === id ? { ...f, ...p } : f,
      ),
    }));
  const removeFeature = (id: string) =>
    setC((s: PlanYourTripContent) => ({
      ...s,
      features: s.features.filter((f: PlanFeature) => f.id !== id),
    }));
  const addFeature = () =>
    setC((s: PlanYourTripContent) => ({
      ...s,
      features: [
        ...s.features,
        { id: rid("feat"), title: "New feature", description: "" },
      ],
    }));

  const setSlot = (slot: SlotKey, url: string) =>
    setC((s: PlanYourTripContent) => ({
      ...s,
      slots: { ...s.slots, [slot]: url },
    }));

  const save = async () => {
    setSaving(true);
    try {
      await planYourTripService.save(c);
      await qc.invalidateQueries({ queryKey: ["plan-your-trip"] });
      toast.success("Plan Your Trip published");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    const fresh = await planYourTripService.reset();
    setC(fresh);
    await qc.invalidateQueries({ queryKey: ["plan-your-trip"] });
    toast.success("Reset to curated defaults");
  };
  const restoreDefaults = () => setC(defaultPlanYourTrip);

  return (
    <div className="relative bg-cream-50">
      <PlanShapeClipDefs />
      <Container className="py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Admin · Homepage
            </p>
            <h1 className="font-serif text-4xl text-ink-900 lg:text-5xl">
              Plan your trip
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-900/60">
              Edit the copy, features and the three collage photos shown in the
              Plan Your Trip section on the homepage.
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

        {/* Copy */}
        <section className="mb-10 grid gap-4 rounded-3xl border border-ink-900/10 bg-white p-6 sm:grid-cols-2">
          <TextField
            label="Eyebrow"
            value={c.eyebrow}
            onChange={(v) => patch({ eyebrow: v })}
          />
          <TextField
            label="Title"
            value={c.title}
            onChange={(v) => patch({ title: v })}
          />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
              Description
            </span>
            <textarea
              value={c.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
            />
          </label>
          <TextField
            label="Button label"
            value={c.ctaLabel}
            onChange={(v) => patch({ ctaLabel: v })}
          />
          <TextField
            label="Button link"
            value={c.ctaHref}
            onChange={(v) => patch({ ctaHref: v })}
          />
        </section>

        {/* Features */}
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-2xl text-ink-900">Features</h2>
          <div className="space-y-4">
            {c.features.map((f: PlanFeature) => (
              <div
                key={f.id}
                className="grid gap-4 rounded-3xl border border-ink-900/10 bg-white p-4 sm:grid-cols-[1fr_2fr_auto]"
              >
                <TextField
                  label="Title"
                  value={f.title}
                  onChange={(v) => updateFeature(f.id, { title: v })}
                />
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
                    Description
                  </span>
                  <textarea
                    value={f.description}
                    onChange={(e) =>
                      updateFeature(f.id, { description: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeFeature(f.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-3 py-1 text-[11px] uppercase tracking-widest text-destructive"
                  >
                    <Trash2 className="size-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addFeature}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-ink-900/30 px-5 py-3 text-[12px] uppercase tracking-widest text-ink-900/70 hover:bg-ink-900/5"
          >
            <Plus className="size-3.5" /> Add feature
          </button>
        </section>

        {/* Slots */}
        <section>
          <h2 className="mb-2 font-serif text-2xl text-ink-900">
            Collage photos
          </h2>
          <p className="mb-6 max-w-lg text-sm text-ink-900/60">
            One photo per shape. Uploads replace the current image immediately.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {(Object.keys(SLOT_META) as SlotKey[]).map((key) => (
              <SlotUploader
                key={key}
                label={SLOT_META[key].label}
                shape={SLOT_META[key].shape}
                imageUrl={c.slots[key]}
                onChange={(url) => setSlot(key, url)}
              />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
      />
    </label>
  );
}

function SlotUploader({
  label,
  shape,
  imageUrl,
  onChange,
}: {
  label: string;
  shape: PlanShapeKey;
  imageUrl: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const s = PLAN_SHAPES[shape];

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const media = await mediaService.upload(file);
      onChange(media.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-ink-900/10 bg-white p-5">
      <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-900/50">
        {label}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={
          "relative w-full overflow-hidden bg-cream-100 drop-shadow-[0_18px_24px_rgba(28,25,23,0.14)] ring-1 ring-ink-900/5 " +
          s.aspect
        }
        style={getPlanShapeClipStyle(shape)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[11px] uppercase tracking-widest text-ink-900/40">
            <ImagePlus className="mx-auto mb-1 size-4" /> Upload
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
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-4 py-2 text-[11px] uppercase tracking-widest text-ink-900/70 hover:bg-ink-900/5"
        >
          <ImagePlus className="size-3.5" /> Replace
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-4 py-2 text-[11px] uppercase tracking-widest text-destructive"
          >
            <Trash2 className="size-3" /> Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}