import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check, Clock, Copy, Download, Eye, History, Link2, Loader2, RotateCcw,
  Share2, Trash2, Upload, X,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { myVaultService, vaultAdminService } from "@/services/vault.service";
import type { VaultDoc } from "@/types/admin.vault";
import {
  Badge, DrawerHeader, SectionTitle, SideDrawer, SkeletonRows, fmtBytes,
  fmtDateTime, relativeTime,
} from "@/components/admin/enterprise/ui";
import { fileGlyph, prettyCategory, VerificationBadge } from "./vault-ui";

export function DocumentDrawer({ docId, onClose, admin, isSuperAdmin }: {
  docId: string | null; onClose: () => void; admin?: boolean; isSuperAdmin?: boolean;
}) {
  const qc = useQueryClient();
  const svc = admin ? vaultAdminService : myVaultService;
  const versionRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareResult, setShareResult] = useState<{ url: string; expires_at: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: [admin ? "admin" : "my", "vault", "doc", docId],
    queryFn: () => svc.detail(docId!) as Promise<VaultDoc>,
    enabled: !!docId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "vault"] });
    qc.invalidateQueries({ queryKey: ["my", "vault"] });
  };

  const preview = useMutation({
    mutationFn: () => svc.previewUrl(docId!),
    onSuccess: (r: { url: string }) => setPreviewUrl(r.url),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const download = useMutation({
    mutationFn: (version?: number) => svc.downloadUrl(docId!, version),
    onSuccess: (r: { url: string }) => { window.open(r.url, "_blank"); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const verify = useMutation({
    mutationFn: (status: "VERIFIED" | "REJECTED") => vaultAdminService.verify(docId!, status),
    onSuccess: () => { toast.success("Verification updated"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const share = useMutation({
    mutationFn: () => myVaultService.share(docId!, { expires_in_hours: 24, watermark: true }),
    onSuccess: (r: { url: string; expires_at: string }) => { setShareResult(r); invalidate(); toast.success("Share link created"); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const addVersion = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return myVaultService.addVersion(docId!, fd);
    },
    onSuccess: () => { toast.success("New version uploaded"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (hard: boolean) => admin ? vaultAdminService.remove(docId!, hard) : myVaultService.remove(docId!),
    onSuccess: () => { toast.success("Document removed"); invalidate(); onClose(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const restore = useMutation({
    mutationFn: () => svc.restore(docId!),
    onSuccess: () => { toast.success("Document restored"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const copyShare = () => {
    if (shareResult) {
      navigator.clipboard.writeText(shareResult.url).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  const Glyph = doc ? fileGlyph(doc.resource_type, doc.format) : Clock;

  return (
    <SideDrawer open={!!docId} onClose={onClose} width="max-w-2xl">
      {doc && (
        <DrawerHeader title={doc.name}
          sub={<span>{prettyCategory(doc.category)} · v{doc.current_version} · {fmtBytes(doc.bytes)}</span>}
          onClose={onClose}>
          <VerificationBadge status={doc.verification} />
        </DrawerHeader>
      )}
      <div className="flex-1 overflow-y-auto p-6" data-lenis-prevent>
        {isLoading || !doc ? <SkeletonRows count={5} /> : (
          <div className="space-y-6">
            {/* Preview area */}
            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-ink-900/[0.08] bg-ink-900/5">
                {doc.resource_type === "image" ? (
                  <img src={previewUrl} alt={doc.name} className="max-h-96 w-full object-contain" />
                ) : (
                  <iframe src={previewUrl} title={doc.name} className="h-96 w-full" />
                )}
              </div>
            ) : (
              <button onClick={() => preview.mutate()} disabled={preview.isPending}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-900/15 bg-white/50 py-12 text-ink-900/50 transition-colors hover:bg-ink-900/[0.02]">
                {preview.isPending ? <Loader2 className="size-6 animate-spin" /> : <Glyph className="size-8" />}
                <span className="text-[12px]">Load secure preview</span>
              </button>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <ActionBtn icon={Download} label="Download" onClick={() => download.mutate(undefined)} loading={download.isPending} />
              {!admin && doc.status === "ACTIVE" && (
                <>
                  <ActionBtn icon={Upload} label="New version" onClick={() => versionRef.current?.click()} loading={addVersion.isPending} />
                  <ActionBtn icon={Share2} label="Share link" onClick={() => share.mutate()} loading={share.isPending} />
                </>
              )}
              {admin && (
                <>
                  <ActionBtn icon={Check} label="Verify" tone="ok" onClick={() => verify.mutate("VERIFIED")} loading={verify.isPending} />
                  <ActionBtn icon={X} label="Reject" tone="alert" onClick={() => verify.mutate("REJECTED")} loading={verify.isPending} />
                </>
              )}
              {doc.status === "DELETED" ? (
                <ActionBtn icon={RotateCcw} label="Restore" onClick={() => restore.mutate()} loading={restore.isPending} />
              ) : (
                <ActionBtn icon={Trash2} label="Delete" tone="alert"
                  onClick={() => { if (!admin || confirm("Move to trash?")) remove.mutate(false); }} loading={remove.isPending} />
              )}
              {admin && isSuperAdmin && doc.status === "DELETED" && (
                <ActionBtn icon={Trash2} label="Purge" tone="alert"
                  onClick={() => { if (confirm("Permanently delete from Cloudinary? This cannot be undone.")) remove.mutate(true); }} />
              )}
              <input ref={versionRef} type="file" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) addVersion.mutate(f); e.target.value = ""; }} />
            </div>

            {shareResult && (
              <div className="rounded-2xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/[0.06] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Link2 className="size-4 text-[color:var(--gold)]" />
                  <SectionTitle>Secure Share Link · expires {relativeTime(shareResult.expires_at)}</SectionTitle>
                </div>
                <div className="flex gap-2">
                  <input readOnly value={shareResult.url} className="flex-1 truncate rounded-lg border border-ink-900/10 bg-white px-3 py-2 font-mono text-[11px]" />
                  <button onClick={copyShare} className="rounded-lg border border-ink-900/10 bg-white px-3 text-ink-900/60 hover:bg-ink-900/5">
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Meta label="Owner" value={doc.user_name ?? doc.user_email ?? "—"} />
              <Meta label="Source" value={doc.source} />
              {doc.booking_reference && <Meta label="Booking" value={doc.booking_reference} />}
              {doc.expiry_date && <Meta label="Expiry" value={fmtDateTime(doc.expiry_date)} />}
              <Meta label="Downloads" value={String(doc.download_count)} />
              <Meta label="Uploaded" value={fmtDateTime(doc.created_at)} />
            </div>

            {/* Versions */}
            {doc.versions && doc.versions.length > 0 && (
              <div>
                <SectionTitle>Version History</SectionTitle>
                <div className="space-y-1.5">
                  {doc.versions.map((v) => (
                    <div key={v.version} className="flex items-center gap-2 rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
                      <History className="size-3.5 text-ink-900/40" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-ink-900">v{v.version} · {fmtBytes(v.bytes)} {v.is_current && <Badge className="bg-emerald-50 text-emerald-700">current</Badge>}</p>
                        <p className="truncate text-[10px] text-ink-900/40">{v.uploaded_by_name} · {relativeTime(v.uploaded_at)} · scan {v.virus_scan}</p>
                      </div>
                      <button onClick={() => download.mutate(v.version)}
                        className="grid size-7 place-items-center rounded-full border border-ink-900/10 text-ink-900/50 hover:bg-ink-900/5">
                        <Download className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share links */}
            {doc.share_links && doc.share_links.length > 0 && (
              <div>
                <SectionTitle>Active Share Links</SectionTitle>
                <div className="space-y-1.5">
                  {doc.share_links.filter((l) => !l.revoked && !l.is_expired).map((l) => (
                    <div key={l.token} className="flex items-center gap-2 rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
                      <Link2 className="size-3.5 text-ink-900/40" />
                      <span className="flex-1 text-[11px] text-ink-900/60">Expires {relativeTime(l.expires_at)} · {l.access_count} views{l.watermark ? " · watermarked" : ""}</span>
                      {!admin && (
                        <button onClick={() => myVaultService.revokeShare(docId!, l.token).then(invalidate)}
                          className="text-[11px] text-rose-500 hover:underline">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {doc.timeline && doc.timeline.length > 0 && (
              <div>
                <SectionTitle>Document Timeline</SectionTitle>
                <div className="relative space-y-2.5 pl-4">
                  <div className="absolute inset-y-1 left-[5px] w-px bg-ink-900/10" />
                  {doc.timeline.slice(0, 15).map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-[13px] top-1 size-2 rounded-full bg-ink-900/30 ring-2 ring-cream-50" />
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] text-ink-900/80">{e.description}</p>
                        <span className="shrink-0 text-[10px] text-ink-900/35">{relativeTime(e.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

function ActionBtn({ icon: Icon, label, onClick, loading, tone }: {
  icon: typeof Download; label: string; onClick: () => void; loading?: boolean; tone?: "ok" | "alert";
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors disabled:opacity-40",
        tone === "alert" ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : tone === "ok" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            : "border-ink-900/10 text-ink-900/65 hover:bg-ink-900/5")}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />} {label}
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</p>
      <p className="mt-0.5 truncate text-ink-900">{value}</p>
    </div>
  );
}
