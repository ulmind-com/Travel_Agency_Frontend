import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { authMeQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: me } = useSuspenseQuery(authMeQuery());
  return (
    <div className="space-y-6 rounded-3xl border border-ink-900/5 bg-cream-50 p-8">
      <div className="flex items-center gap-6">
        <div className="grid size-20 place-items-center rounded-full bg-ink-900 text-2xl font-medium text-cream-50">
          {me.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-serif text-3xl text-ink-900">{me.name}</p>
          <p className="text-sm text-ink-900/60">{me.email}</p>
        </div>
      </div>
      <dl className="grid gap-4 border-t border-ink-900/5 pt-6 md:grid-cols-2">
        <Info label="Role" value={me.role} />
        <Info label="Phone" value={me.phone_number ?? "—"} />
        <Info label="Account id" value={me.id} />
      </dl>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-ink-900/40">{label}</dt>
      <dd className="mt-1 truncate text-sm text-ink-900">{value}</dd>
    </div>
  );
}