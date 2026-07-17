import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X, SlidersHorizontal, Save, FolderOpen, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { crmFacetsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { CrmListParams } from "@/types/admin.crm";

const PRESETS_KEY = "ulmind:crm-presets";

interface Preset { name: string; params: CrmListParams }

function loadPresets(): Preset[] {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "[]"); } catch { return []; }
}
function savePresets(p: Preset[]) {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function CrmFilterDrawer({ open, onClose, params, onApply }: {
  open: boolean;
  onClose: () => void;
  params: CrmListParams;
  onApply: (p: CrmListParams) => void;
}) {
  const { data: facets } = useQuery({ ...crmFacetsQuery(), enabled: open });
  const [draft, setDraft] = useState<CrmListParams>(params);
  const [presets, setPresets] = useState<Preset[]>(loadPresets);

  // Re-sync draft whenever the drawer opens with fresh outer params
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) { setDraft(params); setWasOpen(true); }
  if (!open && wasOpen) setWasOpen(false);

  const set = (k: keyof CrmListParams, v: unknown) =>
    setDraft((d) => ({ ...d, [k]: v === "" || v === "ALL" ? undefined : v }));

  const saveAsPreset = () => {
    const name = prompt("Preset name:");
    if (!name) return;
    const next = [...presets.filter((p) => p.name !== name), { name, params: draft }];
    setPresets(next); savePresets(next);
    toast.success(`Preset “${name}” saved`);
  };
  const applyPreset = (p: Preset) => { setDraft(p.params); onApply(p.params); onClose(); };
  const deletePreset = (name: string) => {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next); savePresets(next);
  };

  const maxSpend = facets?.crm.max_lifetime_spending ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-cream-50 shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
            <div className="flex items-center justify-between border-b border-ink-900/10 px-5 py-4">
              <p className="flex items-center gap-2 font-serif text-xl text-ink-900">
                <SlidersHorizontal className="size-4 text-[color:var(--gold)]" /> Advanced Filters
              </p>
              <button onClick={onClose}
                className="grid size-8 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 hover:text-ink-900">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" data-lenis-prevent="true">
              <Field label="Health category">
                <Sel value={draft.category ?? ""} onChange={(v) => set("category", v)}
                  options={["", ...(facets?.crm.health_categories ?? [])]} placeholder="Any category" />
              </Field>
              <Field label="Membership tier">
                <Sel value={draft.tier ?? ""} onChange={(v) => set("tier", v)}
                  options={["", ...(facets?.crm.tiers ?? [])]} placeholder="Any tier" />
              </Field>
              <Field label="Fraud risk">
                <Sel value={draft.fraud_level ?? ""} onChange={(v) => set("fraud_level", v)}
                  options={["", ...(facets?.crm.fraud_levels ?? [])]} placeholder="Any risk" />
              </Field>
              <Field label="Country">
                <Sel value={draft.country ?? ""} onChange={(v) => set("country", v)}
                  options={["", ...(facets?.geo.countries ?? [])]} placeholder="Any country" />
              </Field>
              <Field label="Registration source">
                <Sel value={draft.registration_source ?? ""} onChange={(v) => set("registration_source", v)}
                  options={["", ...(facets?.crm.registration_sources ?? [])]} placeholder="Any source" />
              </Field>

              <Field label={`Health score  ${draft.min_score ?? 0} – ${draft.max_score ?? 100}`}>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={100} value={draft.min_score ?? ""}
                    placeholder="min" onChange={(e) => set("min_score", e.target.value ? +e.target.value : undefined)}
                    className="w-full rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-sm outline-none" />
                  <span className="text-ink-900/30">–</span>
                  <input type="number" min={0} max={100} value={draft.max_score ?? ""}
                    placeholder="max" onChange={(e) => set("max_score", e.target.value ? +e.target.value : undefined)}
                    className="w-full rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-sm outline-none" />
                </div>
              </Field>
              <Field label={`Lifetime spending (₹)${maxSpend ? ` · data max ₹${Math.round(maxSpend).toLocaleString()}` : ""}`}>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={draft.min_spend ?? ""}
                    placeholder="min ₹" onChange={(e) => set("min_spend", e.target.value ? +e.target.value : undefined)}
                    className="w-full rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-sm outline-none" />
                  <span className="text-ink-900/30">–</span>
                  <input type="number" min={0} value={draft.max_spend ?? ""}
                    placeholder="max ₹" onChange={(e) => set("max_spend", e.target.value ? +e.target.value : undefined)}
                    className="w-full rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-sm outline-none" />
                </div>
              </Field>
              <Field label="Sort by">
                <Sel value={draft.sort ?? "score"} onChange={(v) => set("sort", v)}
                  options={["score", "spend", "fraud", "points", "recent"]} placeholder="score" />
              </Field>

              {/* Presets */}
              <div className="border-t border-ink-900/[0.07] pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/35">
                  <FolderOpen className="size-3" /> Saved presets
                </p>
                {presets.length === 0 ? (
                  <p className="text-[11px] text-ink-900/35">No presets yet — configure filters and save.</p>
                ) : presets.map((p) => (
                  <div key={p.name} className="mb-1 flex items-center gap-1.5">
                    <button onClick={() => applyPreset(p)}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-left text-[12px] text-ink-900/70 shadow-sm hover:bg-ink-900/[0.03]">
                      {p.name}
                    </button>
                    <button onClick={() => deletePreset(p.name)}
                      className="grid size-7 place-items-center rounded-lg text-rose-400 hover:bg-rose-50">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-ink-900/10 px-5 py-3">
              <button onClick={() => { onApply(draft); onClose(); }}
                className="flex-1 rounded-full bg-ink-900 py-2.5 text-sm font-medium text-cream-50 hover:bg-ink-900/90">
                Apply filters
              </button>
              <button onClick={saveAsPreset} title="Save as preset"
                className="grid size-10 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 hover:text-ink-900">
                <Save className="size-4" />
              </button>
              <button
                onClick={() => { const cleared = { sort: draft.sort }; setDraft(cleared); onApply(cleared); }}
                title="Reset all"
                className="grid size-10 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 hover:text-ink-900">
                <RotateCcw className="size-4" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-900/40">{label}</span>
      {children}
    </label>
  );
}

function Sel({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("w-full rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none",
        !value && "text-ink-900/40")}>
      {options.map((o) => (
        <option key={o || "any"} value={o}>{o === "" ? placeholder : o.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
