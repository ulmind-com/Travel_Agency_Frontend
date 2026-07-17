import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Send, Users } from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { marketingService, type CampaignPayload } from "@/services/marketing.service";
import {
  DrawerHeader, SectionTitle, SideDrawer, fmtDateTime,
} from "@/components/admin/enterprise/ui";

/** Full campaign creation flow — channel, audience segment (live sizes),
 * template library, content, UTM and immediate/scheduled send. */
export function CampaignBuilder({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "PUSH">("EMAIL");
  const [segment, setSegment] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [scheduleAt, setScheduleAt] = useState("");

  const { data: meta } = useQuery({ queryKey: ["admin", "marketing", "meta"], queryFn: marketingService.meta });
  const { data: templates } = useQuery({ queryKey: ["admin", "marketing", "templates"], queryFn: marketingService.templates });

  const segmentSize = meta?.segment_sizes?.[segment] ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "marketing"] });

  const buildPayload = (): CampaignPayload => ({
    name: name.trim(), channel, segment,
    subject: subject.trim() || undefined,
    body_html: bodyHtml.trim() || undefined,
    template_id: templateId || undefined,
    landing_url: landingUrl.trim() || undefined,
  });

  const saveDraft = useMutation({
    mutationFn: () => marketingService.createCampaign(buildPayload()),
    onSuccess: () => { toast.success("Draft saved"); invalidate(); onClose(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const sendNow = useMutation({
    mutationFn: async () => {
      const c = await marketingService.createCampaign(buildPayload());
      await marketingService.sendCampaign(c.id, scheduleAt || null);
      return c;
    },
    onSuccess: () => {
      toast.success(scheduleAt ? "Campaign scheduled" : "Campaign sending");
      invalidate(); onClose();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates?.items.find((x) => x.id === id);
    if (t) { setBodyHtml(t.body_html); if (!subject) setSubject(t.subject ?? ""); }
  };

  const canSubmit = name.trim().length >= 2 && (channel !== "EMAIL" || bodyHtml.trim() || templateId);
  const busy = saveDraft.isPending || sendNow.isPending;

  const input = "w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm focus:border-ink-900/30 focus:outline-none";

  return (
    <SideDrawer open onClose={onClose} width="max-w-xl">
      <DrawerHeader title="New Campaign" sub="Reach a real audience segment" onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-6" data-lenis-prevent>
        <div className="space-y-4">
          <div>
            <SectionTitle>Campaign Name</SectionTitle>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Escape 2026" className={input} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionTitle>Channel</SectionTitle>
              <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className={input}>
                {(meta?.channels ?? ["EMAIL", "SMS", "PUSH"]).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <SectionTitle>Audience Segment</SectionTitle>
              <select value={segment} onChange={(e) => setSegment(e.target.value)} className={input}>
                {(meta?.segments ?? []).filter((s) => s !== "CUSTOM").map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")} ({meta?.segment_sizes?.[s] ?? 0})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/[0.06] px-3 py-2.5">
            <Users className="size-4 text-[color:var(--gold)]" />
            <p className="text-[12px] text-ink-900/70">
              <span className="font-semibold text-ink-900">{segmentSize.toLocaleString("en-IN")}</span> recipients in this segment
            </p>
          </div>

          {channel === "EMAIL" && (
            <>
              <div>
                <SectionTitle>Subject</SectionTitle>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="An exclusive escape awaits" className={input} />
              </div>

              {templates && templates.items.length > 0 && (
                <div>
                  <SectionTitle>Template Library</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {templates.items.map((t) => (
                      <button key={t.id} onClick={() => applyTemplate(t.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                          templateId === t.id ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/10 text-ink-900/60 hover:bg-ink-900/5"}`}>
                        <FileText className="size-3" /> {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <SectionTitle>Body (HTML · use {"{{name}}"} and {"{{cta_url}}"})</SectionTitle>
                <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={7}
                  placeholder="<h1>Hi {{name}}</h1><p>Discover our new tours…</p><a href='{{cta_url}}'>Book now</a>"
                  className={`${input} font-mono text-[12px]`} />
              </div>
            </>
          )}

          {channel !== "EMAIL" && (
            <div>
              <SectionTitle>Message</SectionTitle>
              <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={4}
                placeholder="Your short message…" className={input} />
              <p className="mt-1 text-[11px] text-ink-900/40">
                SMS/Push providers are queued as SENT — analytics stay honest about what actually dispatched.
              </p>
            </div>
          )}

          <div>
            <SectionTitle>Landing URL (CTA target · UTM auto-appended)</SectionTitle>
            <input value={landingUrl} onChange={(e) => setLandingUrl(e.target.value)}
              placeholder="https://ulmind.travel/packages" className={input} />
          </div>

          <div>
            <SectionTitle>Schedule (optional · leave blank to send now)</SectionTitle>
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={input} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-ink-900/[0.07] bg-white/70 px-6 py-4 backdrop-blur">
        <button onClick={() => saveDraft.mutate()} disabled={!canSubmit || busy}
          className="flex-1 rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-[12px] font-medium uppercase tracking-widest text-ink-900/65 disabled:opacity-40">
          Save draft
        </button>
        <button onClick={() => sendNow.mutate()} disabled={!canSubmit || busy}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
          {scheduleAt ? "Schedule" : "Send now"}
        </button>
      </div>
    </SideDrawer>
  );
}
