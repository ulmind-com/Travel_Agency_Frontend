import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { marketingService } from "@/services/marketing.service";
import {
  Badge, DrawerHeader, SectionTitle, SideDrawer, SkeletonRows, fmtDateTime, inr,
} from "@/components/admin/enterprise/ui";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-ink-900/5 text-ink-900/55", SCHEDULED: "bg-sky-50 text-sky-700",
  SENDING: "bg-amber-50 text-amber-700", SENT: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-ink-900/5 text-ink-900/40", FAILED: "bg-rose-50 text-rose-700",
};

export function CampaignDrawer({ campaignId, onClose, isSuperAdmin }: {
  campaignId: string | null; onClose: () => void; isSuperAdmin: boolean;
}) {
  const qc = useQueryClient();
  const { data: c, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "campaign", campaignId],
    queryFn: () => marketingService.campaignDetail(campaignId!),
    enabled: !!campaignId,
    refetchInterval: (q) => (q.state.data?.status === "SENDING" ? 4000 : false),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "marketing"] });
  const send = useMutation({
    mutationFn: () => marketingService.sendCampaign(campaignId!, null),
    onSuccess: () => { toast.success("Campaign sending"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const del = useMutation({
    mutationFn: () => marketingService.deleteCampaign(campaignId!),
    onSuccess: () => { toast.success("Campaign removed"); invalidate(); onClose(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <SideDrawer open={!!campaignId} onClose={onClose} width="max-w-xl">
      {c && (
        <DrawerHeader title={c.name}
          sub={<span>{c.channel} · {c.segment} · {c.audience_size} recipients</span>}
          onClose={onClose}>
          <Badge className={STATUS_STYLE[c.status]}>{c.status}</Badge>
        </DrawerHeader>
      )}
      <div className="flex-1 overflow-y-auto p-6" data-lenis-prevent>
        {isLoading || !c ? <SkeletonRows count={5} /> : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Sent" value={String(c.sent_count)} />
              <Metric label="Delivered" value={`${c.rates.delivery_rate}%`} />
              <Metric label="Open Rate" value={`${c.rates.open_rate}%`} />
              <Metric label="Click Rate" value={`${c.rates.click_rate}%`} />
              <Metric label="Conversions" value={String(c.conversion_count)} />
              <Metric label="Revenue" value={inr(c.revenue_generated)} />
            </div>

            {c.recipient_breakdown && Object.keys(c.recipient_breakdown).length > 0 && (
              <div>
                <SectionTitle>Recipient Breakdown</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(c.recipient_breakdown).map(([k, v]) => (
                    <Badge key={k} className="bg-ink-900/5 text-ink-900/60">{k} · {v}</Badge>
                  ))}
                </div>
              </div>
            )}

            {c.utm_campaign && (
              <div>
                <SectionTitle>UTM Tracking</SectionTitle>
                <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 p-3 font-mono text-[11px] text-ink-900/60">
                  utm_source={c.utm_source} · utm_medium={c.utm_medium} · utm_campaign={c.utm_campaign}
                </div>
              </div>
            )}

            {c.conversions && c.conversions.length > 0 && (
              <div>
                <SectionTitle>Recent Conversions</SectionTitle>
                <div className="space-y-1.5">
                  {c.conversions.map((cv, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
                      <span className="truncate text-[12px] text-ink-900">{cv.name ?? cv.email}</span>
                      <span className="text-[12px] font-medium text-emerald-600">{inr(cv.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-ink-900/40">
              Created {fmtDateTime(c.created_at)}
              {c.started_at && <> · started {fmtDateTime(c.started_at)}</>}
              {c.completed_at && <> · completed {fmtDateTime(c.completed_at)}</>}
            </div>
          </div>
        )}
      </div>

      {isSuperAdmin && c && (c.status === "DRAFT" || c.status === "SCHEDULED") && (
        <div className="flex gap-2 border-t border-ink-900/[0.07] bg-white/70 px-6 py-4 backdrop-blur">
          <button onClick={() => del.mutate()} disabled={del.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-4 py-2.5 text-[12px] font-medium text-rose-600 disabled:opacity-40">
            <Trash2 className="size-3.5" /> Delete
          </button>
          <button onClick={() => send.mutate()} disabled={send.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-40">
            <Send className="size-3.5" /> Send now
          </button>
        </div>
      )}
    </SideDrawer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</p>
      <p className="mt-0.5 font-serif text-lg text-ink-900">{value}</p>
    </div>
  );
}
