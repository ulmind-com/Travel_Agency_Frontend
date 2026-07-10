import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Plus, Trash2, User, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { apiErrorMessage } from "@/lib/api";
import { travelersQuery } from "@/lib/queries";
import { travelersService } from "@/services/travelers.service";

const Schema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  age: z.number().int().min(0).max(150),
  relation: z.string().max(50).optional(),
});
type Values = z.infer<typeof Schema>;

export const Route = createFileRoute("/_authenticated/account/travelers")({
  component: TravelersPage,
});

/* ─── skeleton ─── */
function TravelerSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-900/5 bg-cream-50 p-5">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink-900/[0.04] to-transparent" />
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-full bg-ink-900/[0.06]" />
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-full bg-ink-900/[0.06]" />
          <div className="h-3 w-36 rounded-full bg-ink-900/[0.06]" />
        </div>
      </div>
    </div>
  );
}

/* ─── form field ─── */
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink-900/45">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}

const fieldInputClass =
  "w-full rounded-2xl border border-ink-900/[0.08] bg-cream-50/80 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-ink-900/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-900/[0.06] transition-all";

/* ─── gender colors ─── */
function genderColor(g: string) {
  switch (g) {
    case "MALE":
      return "bg-blue-50 text-blue-500";
    case "FEMALE":
      return "bg-pink-50 text-pink-500";
    default:
      return "bg-violet-50 text-violet-500";
  }
}

function TravelersPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(travelersQuery());
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", gender: "OTHER", age: 30, relation: "" },
  });

  const create = useMutation({
    mutationFn: (v: Values) => travelersService.create(v),
    onSuccess: () => {
      toast.success("Traveler saved");
      reset();
      qc.invalidateQueries({ queryKey: ["travelers"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not save traveler")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => travelersService.remove(id),
    onSuccess: () => {
      toast.success("Traveler removed");
      qc.invalidateQueries({ queryKey: ["travelers"] });
    },
    onError: (e) =>
      toast.error(apiErrorMessage(e, "Could not remove traveler")),
  });

  /* error */
  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-red-200/60 bg-red-50/40 p-10 text-center backdrop-blur-sm"
      >
        <AlertCircle className="mx-auto size-8 text-red-300" />
        <p className="mt-4 font-serif text-2xl text-red-800/80">
          Couldn&apos;t load travelers
        </p>
        <p className="mt-2 text-sm text-red-600/60">
          Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 rounded-full bg-red-600/90 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  const travelers = data ?? [];

  return (
    <div className="space-y-10">
      {/* ─── traveler list ─── */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-ink-900/[0.04]">
            <Users className="size-4 text-ink-900/30" />
          </div>
          <h2 className="font-serif text-2xl text-ink-900">
            Saved companions
          </h2>
          {!isLoading && (
            <span className="rounded-full bg-ink-900/[0.05] px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-900/40">
              {travelers.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <TravelerSkeleton key={i} />
            ))}
          </div>
        ) : travelers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl border border-ink-900/5 bg-cream-50 p-8 text-center"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-amber-400/[0.05] blur-2xl" />
            <div className="relative">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-ink-900/[0.04]">
                <User className="size-5 text-ink-900/20" />
              </div>
              <p className="mt-3 text-sm text-ink-900/50">
                No saved travelers yet. Add companions below to speed up
                bookings.
              </p>
            </div>
          </motion.div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            <AnimatePresence>
              {travelers.map((t, i) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="group flex items-center justify-between rounded-2xl border border-ink-900/[0.06] bg-cream-50 p-4 transition-all duration-200 hover:border-ink-900/12 hover:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-3.5">
                    {/* avatar */}
                    <div
                      className={`grid size-11 place-items-center rounded-full text-sm font-semibold ${genderColor(t.gender)}`}
                    >
                      {t.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">{t.name}</p>
                      <p className="mt-0.5 text-xs text-ink-900/45">
                        {t.gender.charAt(0) + t.gender.slice(1).toLowerCase()} ·{" "}
                        {t.age} yrs · {t.relation ?? "Companion"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${t.name}`}
                    onClick={() => remove.mutate(t.id)}
                    className="grid size-9 place-items-center rounded-full text-ink-900/25 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {/* ─── add form ─── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl border border-ink-900/[0.06] bg-cream-50 p-7"
      >
        <div className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-blue-400/[0.04] blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl bg-ink-900/[0.04]">
              <Plus className="size-4 text-ink-900/30" />
            </div>
            <h3 className="font-serif text-xl text-ink-900">Add a traveler</h3>
          </div>

          <form
            onSubmit={handleSubmit((v) => create.mutate(v))}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <FormField label="Full name" error={errors.name?.message}>
              <input
                {...register("name")}
                className={fieldInputClass}
                placeholder="Enter full name"
              />
            </FormField>
            <FormField label="Gender" error={errors.gender?.message}>
              <select {...register("gender")} className={fieldInputClass}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Age" error={errors.age?.message}>
              <input
                type="number"
                min={0}
                max={150}
                {...register("age", { valueAsNumber: true })}
                className={fieldInputClass}
                placeholder="30"
              />
            </FormField>
            <FormField label="Relation (optional)" error={errors.relation?.message}>
              <input
                {...register("relation")}
                className={fieldInputClass}
                placeholder="Partner, sibling…"
              />
            </FormField>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting || create.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 transition-all hover:bg-ink-900/90 active:scale-95 disabled:opacity-50"
              >
                {create.isPending ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-cream-50/30 border-t-cream-50" />
                    Saving…
                  </>
                ) : (
                  "Save traveler"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.section>
    </div>
  );
}