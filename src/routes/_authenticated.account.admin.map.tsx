import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, Layers, MapPin, Navigation, Radio, Route as RouteIcon, Satellite,
  TrafficCone, Users, Waypoints,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { mapService } from "@/services/map.service";
import type { TripRow } from "@/types/admin.map";
import {
  Badge, EmptyState, GlassPanel, PillTabs, SectionTitle, SkeletonRows,
  StatCard, compact, inr, relativeTime,
} from "@/components/admin/enterprise/ui";
import { OpsMapCanvas } from "@/components/admin/map/OpsMapCanvas";

export const Route = createFileRoute("/_authenticated/account/admin/map")({
  component: OperationsMapPage,
});

type SideTab = "trips" | "destinations" | "geo" | "live";

const PHASE_STYLE: Record<string, string> = {
  ONGOING: "bg-amber-50 text-amber-700", UPCOMING: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

function OperationsMapPage() {
  const { isSuperAdmin } = useAuth();
  const { status: mapStatus, gmaps } = useGoogleMaps();

  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [sideTab, setSideTab] = useState<SideTab>("trips");
  const [replayStaff, setReplayStaff] = useState<string | null>(null);

  const { data: overview } = useQuery({
    queryKey: ["admin", "map", "overview"], queryFn: mapService.overview,
    refetchInterval: 30_000,
  });
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ["admin", "map", "trips", phaseFilter],
    queryFn: () => mapService.trips(phaseFilter === "ALL" ? undefined : phaseFilter),
    refetchInterval: 30_000,
  });
  const { data: heat } = useQuery({ queryKey: ["admin", "map", "heatmap"], queryFn: mapService.heatmap });
  const { data: geofences } = useQuery({ queryKey: ["admin", "map", "geofences"], queryFn: mapService.geofences });
  const { data: live } = useQuery({
    queryKey: ["admin", "map", "live"], queryFn: mapService.live,
    enabled: isSuperAdmin, refetchInterval: 10_000,
  });
  const { data: geoBreak } = useQuery({
    queryKey: ["admin", "map", "geo", "country"],
    queryFn: () => mapService.geoBreakdown("country"),
    enabled: sideTab === "geo",
  });
  const { data: replay } = useQuery({
    queryKey: ["admin", "map", "replay", replayStaff],
    queryFn: () => mapService.replay(replayStaff!),
    enabled: !!replayStaff,
  });

  const trips = tripsData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-3xl text-ink-900">
            Operations Map
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-white px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-ink-900/60">
              <Radio className="size-3 text-rose-500" /> Real-time
            </span>
          </h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Live trips, guide &amp; driver positions, destination heatmap and geofences — all geocoded from real bookings.
          </p>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <StatCard icon={RouteIcon} label="Total Trips" value={String(overview.total_trips)} />
          <StatCard icon={Navigation} label="Ongoing" value={String(overview.trips.ONGOING)} tone="warn" />
          <StatCard icon={MapPin} label="Upcoming" value={String(overview.trips.UPCOMING)} />
          <StatCard icon={Radio} label="Live Staff" value={String(overview.live_staff)}
            tone={overview.live_staff > 0 ? "ok" : undefined} />
          <StatCard icon={Waypoints} label="Geofences" value={String(overview.geofences)} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Map */}
        <GlassPanel className="relative min-h-[560px]">
          {/* Layer controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
            <LayerBtn active={mapType === "satellite"} icon={Satellite}
              onClick={() => setMapType(mapType === "satellite" ? "roadmap" : "satellite")} title="Satellite" />
            <LayerBtn active={showHeatmap} icon={Flame} onClick={() => setShowHeatmap((v) => !v)} title="Heatmap" />
            <LayerBtn active={showTraffic} icon={TrafficCone} onClick={() => setShowTraffic((v) => !v)} title="Traffic" />
          </div>

          <div className="h-[560px] w-full overflow-hidden rounded-3xl">
            {mapStatus === "ready" && gmaps ? (
              <OpsMapCanvas gmaps={gmaps} trips={trips} heat={heat?.points ?? []}
                live={live?.items ?? []} geofences={geofences?.items ?? []}
                replay={replay?.points ?? null}
                showHeatmap={showHeatmap} showTraffic={showTraffic} mapType={mapType} />
            ) : mapStatus === "loading" ? (
              <div className="grid h-full place-items-center text-ink-900/40"><span className="text-sm">Loading map…</span></div>
            ) : (
              <MapUnavailable trips={trips} heat={heat?.points ?? []} status={mapStatus} />
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 border-t border-ink-900/[0.06] px-5 py-2.5 text-[11px] text-ink-900/50">
            <LegendDot color="#f59e0b" label="Ongoing" />
            <LegendDot color="#0ea5e9" label="Upcoming" />
            <LegendDot color="#10b981" label="Completed" />
            <LegendDot color="#ef4444" label="Live staff" />
            <LegendDot color="#c8a24a" label="Geofence" />
          </div>
        </GlassPanel>

        {/* Side panel */}
        <div className="space-y-3">
          <PillTabs
            tabs={[
              { id: "trips", label: "Trips", icon: RouteIcon },
              { id: "destinations", label: "Top", icon: Flame },
              { id: "geo", label: "Geo", icon: MapPin },
              ...(isSuperAdmin ? [{ id: "live" as SideTab, label: "Live", icon: Radio }] : []),
            ]}
            active={sideTab} onChange={(t) => setSideTab(t as SideTab)} />

          {sideTab === "trips" && (
            <>
              <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}
                className="w-full rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm shadow-sm">
                {["ALL", "ONGOING", "UPCOMING", "COMPLETED"].map((p) => <option key={p}>{p}</option>)}
              </select>
              <GlassPanel>
                <div className="max-h-[440px] overflow-y-auto" data-lenis-prevent>
                  {tripsLoading ? <SkeletonRows count={4} /> : !trips.length ? (
                    <EmptyState icon={RouteIcon} title="No trips" />
                  ) : (
                    <div className="divide-y divide-ink-900/[0.05]">
                      {trips.map((t) => <TripCard key={t.booking_id} t={t} />)}
                    </div>
                  )}
                </div>
              </GlassPanel>
            </>
          )}

          {sideTab === "destinations" && (
            <GlassPanel>
              <div className="border-b border-ink-900/[0.06] px-5 py-3"><SectionTitle>Popular Destinations</SectionTitle></div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-ink-900/[0.05]" data-lenis-prevent>
                {(heat?.top_destinations ?? []).map((h, i) => (
                  <div key={h.destination} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 text-center font-serif text-lg text-ink-900/30">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink-900">{h.destination}</p>
                      <p className="truncate text-[11px] text-ink-900/45">{h.country} · {h.travelers} travellers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-medium text-ink-900">{h.bookings} trips</p>
                      <p className="text-[11px] text-ink-900/45">{inr(h.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {sideTab === "geo" && (
            <GlassPanel>
              <div className="border-b border-ink-900/[0.06] px-5 py-3"><SectionTitle>Country-wise Bookings</SectionTitle></div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-ink-900/[0.05]" data-lenis-prevent>
                {(geoBreak?.items ?? []).map((g) => (
                  <div key={g.name} className="flex items-center gap-3 px-5 py-3">
                    <MapPin className="size-4 text-ink-900/35" />
                    <span className="flex-1 truncate text-[13px] text-ink-900">{g.name}</span>
                    <div className="text-right">
                      <p className="text-[12px] font-medium text-ink-900">{g.bookings}</p>
                      <p className="text-[11px] text-ink-900/45">{inr(g.revenue)}</p>
                    </div>
                  </div>
                ))}
                {!geoBreak?.items.length && <EmptyState icon={MapPin} title="No data" />}
              </div>
            </GlassPanel>
          )}

          {sideTab === "live" && isSuperAdmin && (
            <GlassPanel>
              <div className="border-b border-ink-900/[0.06] px-5 py-3"><SectionTitle>Live Positions</SectionTitle></div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-ink-900/[0.05]" data-lenis-prevent>
                {(live?.items ?? []).length === 0 ? (
                  <EmptyState icon={Radio} title="No live positions"
                    sub="Staff positions appear here as location pings arrive." />
                ) : live!.items.map((p) => (
                  <div key={p.staff_id} className="flex items-center gap-3 px-5 py-3">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink-900">{p.staff_name}</p>
                      <p className="truncate text-[11px] text-ink-900/45">
                        {p.staff_type} · {p.speed_kmh ? `${p.speed_kmh} km/h · ` : ""}{relativeTime(p.recorded_at)}
                      </p>
                    </div>
                    <button onClick={() => setReplayStaff(replayStaff === p.staff_id ? null : p.staff_id)}
                      className={cn("rounded-full border px-2.5 py-1 text-[10px] font-medium",
                        replayStaff === p.staff_id ? "border-violet-300 bg-violet-50 text-violet-700" : "border-ink-900/10 text-ink-900/55")}>
                      Replay
                    </button>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}

function TripCard({ t }: { t: TripRow }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13px] text-ink-900">{t.package.destination ?? t.package.title}</p>
        <Badge className={PHASE_STYLE[t.phase]}>{t.phase}</Badge>
      </div>
      <p className="truncate text-[11px] text-ink-900/45">{t.booking_reference} · {t.customer.name}</p>
      {t.phase === "ONGOING" && t.progress_pct != null && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[10px] text-ink-900/45">
            <span>Progress</span><span>{t.progress_pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-900/5">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${t.progress_pct}%` }} />
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {t.distance_km != null && <Badge className="bg-ink-900/5 text-ink-900/55">{t.distance_km} km</Badge>}
        {t.staff.map((s) => (
          <Badge key={s.assignment_id} className="bg-sky-50 text-sky-700">{s.role}: {s.name}</Badge>
        ))}
        {t.is_checked_in && <Badge className="bg-emerald-50 text-emerald-700">Checked in</Badge>}
      </div>
    </div>
  );
}

function LayerBtn({ active, icon: Icon, onClick, title }: {
  active: boolean; icon: typeof Flame; onClick: () => void; title: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn("grid size-9 place-items-center rounded-xl border shadow-sm backdrop-blur transition-colors",
        active ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/10 bg-white/90 text-ink-900/60 hover:bg-white")}>
      <Icon className="size-4" />
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}

function MapUnavailable({ trips, heat, status }: {
  trips: TripRow[]; heat: { destination: string; bookings: number; lat: number; lng: number }[]; status: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-ink-900/[0.02] p-6 text-center">
      <Layers className="size-9 text-ink-900/20" />
      <div>
        <p className="font-serif text-lg text-ink-900/60">
          {status === "error" ? "Map failed to load" : "Interactive map not configured"}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-ink-900/40">
          Set <code className="rounded bg-ink-900/5 px-1">VITE_GOOGLE_MAPS_API_KEY</code> to enable the live Google Map.
          Trip and destination data below stay fully functional.
        </p>
      </div>
      <div className="mt-2 grid w-full max-w-md grid-cols-2 gap-2 text-left">
        <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-900/40">Geocoded trips</p>
          <p className="font-serif text-2xl text-ink-900">{trips.filter((t) => t.destination_coords).length}</p>
        </div>
        <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-900/40">Mapped destinations</p>
          <p className="font-serif text-2xl text-ink-900">{heat.length}</p>
        </div>
      </div>
    </div>
  );
}
