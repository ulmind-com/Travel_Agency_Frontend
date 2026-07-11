import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import {
  achievementsService,
  defaultAchievements,
  type AchievementStat,
  type AchievementsContent,
} from "@/services/achievements.service";

export const Route = createFileRoute(
  "/_authenticated/account/admin/achievements",
)({
  head: () => ({
    meta: [
      { title: "Achievements — Admin · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAchievementsPage,
});

function AdminAchievementsPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [c, setC] = useState<AchievementsContent>(defaultAchievements);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/account", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    let alive = true;
    achievementsService.get().then((s) => {
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

  const patch = (p: Partial<AchievementsContent>) =>
    setC((s) => ({ ...s, ...p }));
  const updateStat = (id: string, p: Partial<AchievementStat>) =>
    setC((s) => ({
      ...s,
      stats: s.stats.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  const save = async () => {
    setSaving(true);
    try {
      await achievementsService.save(c);
      await qc.invalidateQueries({ queryKey: ["achievements"] });
      toast.success("Achievements published");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    const fresh = await achievementsService.reset();
    setC(fresh);
    await qc.invalidateQueries({ queryKey: ["achievements"] });
    toast.success("Reset to defaults");
  };

  return (
    <div className="admin-studio">
      <Container className="py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Admin · Homepage
            </p>
            <h1 className="font-serif text-4xl text-ink-900 lg:text-5xl">
              Achievements
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-900/60">
              Update the four milestone circles shown on the homepage. Leave
              eyebrow &amp; title blank to hide the header.
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
              Eyebrow (optional)
            </span>
            <input
              value={c.eyebrow}
              onChange={(e) => patch({ eyebrow: e.target.value })}
              className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
              Title (optional)
            </span>
            <input
              value={c.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
            />
          </label>
        </section>

        <section>
          <h2 className="mb-4 font-serif text-2xl text-ink-900">Stats</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.stats.map((s, i) => (
              <div
                key={s.id}
                className="rounded-3xl border border-ink-900/10 bg-white p-5"
              >
                <span className="text-[11px] uppercase tracking-widest text-ink-900/50">
                  Circle {i + 1}
                </span>
                <label className="mt-3 block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
                    Value
                  </span>
                  <input
                    value={s.value}
                    onChange={(e) => updateStat(s.id, { value: e.target.value })}
                    placeholder="e.g. 97%"
                    className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-lg font-serif text-ink-900 focus:border-ink-900/40 focus:outline-none"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-ink-900/40">
                    Label
                  </span>
                  <input
                    value={s.label}
                    onChange={(e) => updateStat(s.id, { label: e.target.value })}
                    className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900/40 focus:outline-none"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}