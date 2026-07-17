import { useQuery } from "@tanstack/react-query";
import { adminUserTimelineQuery } from "@/lib/queries";
import { format } from "date-fns";
import { ShieldAlert, Activity, CheckCircle, CreditCard, Ticket } from "lucide-react";

export function ActivityTimeline({ userId }: { userId: string }) {
  const { data: timeline, isLoading } = useQuery(adminUserTimelineQuery(userId));

  if (isLoading) return <div className="p-6 text-center text-ink-900/40">Loading timeline...</div>;
  if (!timeline || timeline.length === 0) return <div className="p-6 text-center text-ink-900/40">No activity recorded.</div>;

  return (
    <div className="bg-white rounded-3xl p-6 border border-ink-900/5 shadow-sm space-y-6">
      <h3 className="font-serif text-xl font-medium">360° Timeline</h3>
      <div className="relative border-l border-ink-900/10 ml-3 space-y-6 pb-4">
        {timeline.map((item: any, idx: number) => {
          const isAudit = item.type === "AUDIT";
          return (
            <div key={idx} className="relative pl-6">
              <span className={`absolute -left-[9px] top-1 flex items-center justify-center size-4 rounded-full border-2 border-white ${isAudit ? 'bg-red-500' : 'bg-brand-500'}`} />
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-ink-900 capitalize flex items-center gap-2">
                    {item.action.replace(/_/g, ' ').toLowerCase()}
                    {isAudit && <ShieldAlert className="size-3 text-red-500" />}
                  </p>
                  <p className="text-xs text-ink-900/60 mt-1">{item.description}</p>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-ink-900/40 text-right shrink-0 ml-4">
                  {format(new Date(item.created_at), "MMM d, HH:mm")}
                </p>
              </div>
              {item.ip && <p className="text-[10px] text-ink-900/30 mt-2">{item.ip} {item.device && `• ${item.device}`}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
