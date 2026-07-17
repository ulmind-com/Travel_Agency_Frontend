import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock, CloudUpload, FolderOpen, HardDrive, Loader2,
  Search, ShieldCheck, Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { vaultAdminService } from "@/services/vault.service";
import type { VaultDoc, VaultOverview } from "@/types/admin.vault";
import {
  Badge, EmptyState, GlassPanel, Pagination, PillTabs, SectionTitle,
  SkeletonRows, StatCard, fmtBytes, relativeTime,
} from "@/components/admin/enterprise/ui";
import {
  categoryIcon, fileGlyph, prettyCategory, VerificationBadge,
} from "@/components/admin/vault/vault-ui";
import { DocumentDrawer } from "@/components/admin/vault/DocumentDrawer";

export const Route = createFileRoute("/_authenticated/account/admin/documents")({
  component: DocumentVaultPage,
});

type Tab = "overview" | "all" | "expiring" | "trash";

function DocumentVaultPage() {
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [focusDoc, setFocusDoc] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; icon: typeof FolderOpen }[] = [
    { id: "overview", label: "Overview", icon: HardDrive },
    { id: "all", label: "All Documents", icon: FolderOpen },
    { id: "expiring", label: "Expiring", icon: Clock },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-3xl text-ink-900">
            Document Vault
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="size-3" /> Encrypted
            </span>
          </h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Every passport, visa, invoice, ticket and QR image — version-controlled in Cloudinary with signed access.
          </p>
        </div>
        <PillTabs tabs={tabs} active={tab} onChange={(t) => setTab(t as Tab)} />
      </div>

      {tab === "overview" && <OverviewTab isSuperAdmin={isSuperAdmin} onFocus={setFocusDoc} />}
      {tab === "all" && <ListTab statusFilter="ACTIVE" isSuperAdmin={isSuperAdmin} onFocus={setFocusDoc} />}
      {tab === "expiring" && <ListTab statusFilter="ACTIVE" expiring onFocus={setFocusDoc} isSuperAdmin={isSuperAdmin} />}
      {tab === "trash" && <ListTab statusFilter="DELETED" isSuperAdmin={isSuperAdmin} onFocus={setFocusDoc} />}

      <DocumentDrawer docId={focusDoc} onClose={() => setFocusDoc(null)} admin isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ isSuperAdmin, onFocus }: { isSuperAdmin: boolean; onFocus: (id: string) => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vault", "overview"],
    queryFn: vaultAdminService.overview,
    refetchInterval: 60_000,
  });
  const backfill = useMutation({
    mutationFn: vaultAdminService.backfill,
    onSuccess: (r: { created: number }) => { toast.success(`Registered ${r.created} existing document(s)`); qc.invalidateQueries({ queryKey: ["admin", "vault"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (isLoading || !data) return <SkeletonRows count={4} height="h-24" />;
  const o: VaultOverview = data;
  const s = o.storage;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={FolderOpen} label="Documents" value={String(s.total_documents)} sub={`${s.total_versions} versions`} />
        <StatCard icon={HardDrive} label="Vault Storage" value={fmtBytes(s.total_bytes)}
          sub={o.cloudinary.storage_bytes ? `Cloud: ${fmtBytes(o.cloudinary.storage_bytes)}` : undefined} />
        <StatCard icon={ShieldCheck} label="Verified" value={String(o.by_verification.VERIFIED ?? 0)}
          sub={`${o.by_verification.PENDING ?? 0} pending`} tone="ok" />
        <StatCard icon={Clock} label="Expired" value={String(o.expired_count)}
          tone={o.expired_count > 0 ? "alert" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-5 py-3">
            <SectionTitle>Storage by Category</SectionTitle>
            {isSuperAdmin && (
              <button onClick={() => backfill.mutate()} disabled={backfill.isPending}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-900/55 hover:text-ink-900">
                {backfill.isPending ? <Loader2 className="size-3 animate-spin" /> : <CloudUpload className="size-3" />} Sync existing
              </button>
            )}
          </div>
          <div className="space-y-2 p-5">
            {s.by_category.length === 0 ? <EmptyState icon={FolderOpen} title="No documents yet" /> :
              s.by_category.map((c) => {
                const Icon = categoryIcon(c.category);
                const pct = s.total_bytes > 0 ? (c.bytes / s.total_bytes) * 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center gap-2 text-[12px]">
                      <Icon className="size-3.5 text-ink-900/45" />
                      <span className="flex-1 text-ink-900/70">{prettyCategory(c.category)}</span>
                      <span className="text-ink-900/45">{c.count} · {fmtBytes(c.bytes)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-900/5">
                      <div className="h-full rounded-full bg-ink-900/40" style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="border-b border-ink-900/[0.06] px-5 py-3"><SectionTitle>Recent Activity</SectionTitle></div>
          <div className="divide-y divide-ink-900/[0.05]">
            {o.recent_activity.length === 0 ? <EmptyState icon={Clock} title="No activity" /> :
              o.recent_activity.map((e) => (
                <div key={e.id} className="flex items-center gap-2 px-5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-ink-900">{e.description}</p>
                    <p className="text-[10px] text-ink-900/40">{e.action} · {e.actor_name ?? "—"}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-ink-900/35">{relativeTime(e.created_at)}</span>
                </div>
              ))}
          </div>
        </GlassPanel>
      </div>

      {o.expiring_soon.length > 0 && (
        <GlassPanel>
          <div className="border-b border-ink-900/[0.06] px-5 py-3"><SectionTitle>Expiring Soon</SectionTitle></div>
          <div className="divide-y divide-ink-900/[0.05]">
            {o.expiring_soon.map((d) => <DocRow key={d.id} d={d} onClick={() => onFocus(d.id)} />)}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────
function ListTab({ statusFilter, expiring, onFocus }: {
  statusFilter: string; expiring?: boolean; isSuperAdmin: boolean; onFocus: (id: string) => void;
}) {
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({
    status: statusFilter, category, search: search.trim() || undefined,
    expiring_days: expiring ? 60 : undefined, page,
  }), [statusFilter, category, search, expiring, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vault", "list", params],
    queryFn: () => vaultAdminService.list(params),
    placeholderData: keepPreviousData,
  });

  const CATEGORIES = ["ALL", "PASSPORT", "VISA", "AADHAR", "PAN", "DRIVING_LICENSE",
    "INSURANCE", "GOVERNMENT_ID", "INVOICE", "TICKET", "QR_IMAGE", "TRAVEL_VOUCHER", "OTHER"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/30" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, user, booking…"
            className="w-full rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-4 text-sm shadow-sm" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm shadow-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === "ALL" ? "All categories" : prettyCategory(c)}</option>)}
        </select>
      </div>

      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={FolderOpen} title={statusFilter === "DELETED" ? "Trash is empty" : "No documents"} />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((d) => (
              <DocRow key={d.id} d={d} onClick={() => onFocus(d.id)} showUser />
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="documents" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

function DocRow({ d, onClick, showUser }: { d: VaultDoc; onClick: () => void; showUser?: boolean }) {
  const Glyph = fileGlyph(d.resource_type, d.format);
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-900/[0.02]">
      <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl",
        d.is_sensitive ? "bg-rose-50 text-rose-500" : "bg-ink-900/5 text-ink-900/50")}>
        <Glyph className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-900">{d.name}</p>
        <p className="truncate text-[11px] text-ink-900/45">
          {prettyCategory(d.category)} · v{d.current_version} · {fmtBytes(d.bytes)}
          {showUser && d.user_email ? ` · ${d.user_email}` : ""}
          {d.booking_reference ? ` · ${d.booking_reference}` : ""}
        </p>
      </div>
      {d.expiry_date && (
        <Badge className={d.is_expired ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}>
          {d.is_expired ? "Expired" : `Exp ${relativeTime(d.expiry_date)}`}
        </Badge>
      )}
      <VerificationBadge status={d.verification} />
    </button>
  );
}
