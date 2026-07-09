import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Field, inputClass } from "@/routes/auth.login";
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

function TravelersPage() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(travelersQuery());
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
    onError: (e) => toast.error(apiErrorMessage(e, "Could not remove traveler")),
  });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-serif text-2xl text-ink-900">Saved companions</h2>
        {data.length === 0 ? (
          <p className="rounded-2xl border border-ink-900/5 bg-cream-50 p-6 text-sm text-ink-900/60">
            No saved travelers yet. Add companions below to speed up bookings.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {data.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-2xl border border-ink-900/5 bg-cream-50 p-4"
              >
                <div>
                  <p className="font-medium text-ink-900">{t.name}</p>
                  <p className="text-xs text-ink-900/60">
                    {t.gender.toLowerCase()} · {t.age} · {t.relation ?? "companion"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${t.name}`}
                  onClick={() => remove.mutate(t.id)}
                  className="grid size-9 place-items-center rounded-full text-ink-900/50 hover:bg-cream-100 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-ink-900/5 bg-cream-50 p-6">
        <h3 className="font-serif text-xl text-ink-900">Add a traveler</h3>
        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <Field label="Name" error={errors.name?.message}>
            <input {...register("name")} className={inputClass} placeholder="Full name" />
          </Field>
          <Field label="Gender" error={errors.gender?.message}>
            <select {...register("gender")} className={inputClass}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Age" error={errors.age?.message}>
            <input
              type="number"
              min={0}
              max={150}
              {...register("age", { valueAsNumber: true })}
              className={inputClass}
            />
          </Field>
          <Field label="Relation (optional)" error={errors.relation?.message}>
            <input {...register("relation")} className={inputClass} placeholder="Partner, sibling…" />
          </Field>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || create.isPending}
              className="rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Save traveler"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}