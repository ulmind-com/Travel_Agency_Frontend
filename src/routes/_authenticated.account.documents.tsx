import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderOpen, HardDrive, Loader2, Search, ShieldCheck, Upload,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { myVaultService } from "@/services/vault.service";
import type { VaultDoc } from "@/types/admin.vault";
import {
  Badge, EmptyState, GlassPanel, SectionTitle, SkeletonRows, StatCard,
  fmtBytes, relativeTime,
} from "@/components/admin/enterprise/ui";
import {
  categoryIcon, fileGlyph, prettyCategory, VerificationBadge,
} from "@/components/admin/vault/vault-ui";
import { DocumentDrawer } from "@/components/admin/vault/DocumentDrawer";

export const Route = createFileRoute("/_authenticated/account/documents")({
  component: MyDocumentsPage,
});

const UPLOAD_CATEGORIES = [
  "PASSPORT", "VISA", "AADHAR", "PAN", "DRIVING_LICENSE", "INSURANCE",
  "TRAVEL_PERMIT", "GOVERNMENT_ID", "ADDRESS_PROOF", "OTHER",
];

function MyDocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [uploadCat, setUploadCat] = useState("PASSPORT");
  const [focusDoc, setFocusDoc] = useState<string | null>(null);

  const params = useMemo(() => ({ category, search: search.trim() || undefined, status: "ACTIVE" }), [category, search]);
  const { data, isLoading } = useQuery({
    queryKey: ["my", "vault", "list", params],
    queryFn: () => myVaultService.list(params),
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name.replace(/\.[^.]+$/, ""));
      fd.append("category", uploadCat);
      return myVaultService.upload(fd);
    },
    onSuccess: () => { toast.success("Document uploaded securely"); qc.invalidateQueries({ queryKey: ["my", "vault"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const storage = data?.storage;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-3xl text-ink-900">
          My Documents
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="size-3" /> Encrypted Vault
          </span>
        </h2>
        <p className="mt-1 text-sm text-ink-900/55">
          Store your passport, visa, ID and travel documents securely. Only you and authorised staff can access them.
        </p>
      </div>

      {storage && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={FolderOpen} label="Documents" value={String(storage.total_documents)} />
          <StatCard icon={HardDrive} label="Storage Used" value={fmtBytes(storage.total_bytes)} />
          <StatCard icon={ShieldCheck} label="Categories" value={String(storage.by_category.length)} />
        </div>
      )}

      {/* Upload */}
      <GlassPanel>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}
            className="rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm">
            {UPLOAD_CATEGORIES.map((c) => <option key={c} value={c}>{prettyCategory(c)}</option>)}
          </select>
          <button onClick={() => fileRef.current?.click()} disabled={upload.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-40">
            {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-3.5" />}
            Upload document
          </button>
          <p className="text-[11px] text-ink-900/40">Images, PDF or ZIP · up to 25 MB</p>
          <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.zip"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ""; }} />
        </div>
      </GlassPanel>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search my documents…"
            className="w-full rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-4 text-sm shadow-sm" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm shadow-sm">
          <option value="ALL">All categories</option>
          {UPLOAD_CATEGORIES.concat(["INVOICE", "TICKET", "QR_IMAGE", "TRAVEL_VOUCHER"]).map((c) =>
            <option key={c} value={c}>{prettyCategory(c)}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? <SkeletonRows count={4} height="h-20" /> : !data?.items.length ? (
        <GlassPanel><EmptyState icon={FolderOpen} title="No documents yet"
          sub="Upload your travel documents to keep them safe and accessible." /></GlassPanel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((d: VaultDoc) => {
            const Icon = categoryIcon(d.category);
            const Glyph = fileGlyph(d.resource_type, d.format);
            return (
              <button key={d.id} onClick={() => setFocusDoc(d.id)}
                className="group flex flex-col rounded-2xl border border-ink-900/[0.08] bg-white/70 p-4 text-left shadow-sm backdrop-blur transition-all hover:border-ink-900/20 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className={cn("grid size-11 place-items-center rounded-xl",
                    d.is_sensitive ? "bg-rose-50 text-rose-500" : "bg-ink-900/5 text-ink-900/50")}>
                    <Icon className="size-5" />
                  </div>
                  <VerificationBadge status={d.verification} />
                </div>
                <p className="mt-3 truncate text-[13px] font-medium text-ink-900">{d.name}</p>
                <p className="truncate text-[11px] text-ink-900/45">{prettyCategory(d.category)} · v{d.current_version}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-900/40">
                  <Glyph className="size-3" /> {fmtBytes(d.bytes)} · {relativeTime(d.created_at)}
                </div>
                {d.expiry_date && (
                  <Badge className={cn("mt-2 self-start", d.is_expired ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>
                    {d.is_expired ? "Expired" : `Expires ${relativeTime(d.expiry_date)}`}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      <DocumentDrawer docId={focusDoc} onClose={() => setFocusDoc(null)} />
    </div>
  );
}
