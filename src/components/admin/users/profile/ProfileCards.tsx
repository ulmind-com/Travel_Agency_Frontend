import type { AdminUser } from "@/types/admin.users";
import { format } from "date-fns";
import { Monitor, Smartphone, Globe, Shield, Ticket, Star, CreditCard } from "lucide-react";

export function PersonalInfoCard({ user }: { user: AdminUser }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-ink-900/5 shadow-sm space-y-4">
      <h3 className="font-serif text-xl font-medium">Personal Information</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Gender</p><p>{user.gender || "—"}</p></div>
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Date of Birth</p><p>{user.dob ? format(new Date(user.dob), "MMM d, yyyy") : "—"}</p></div>
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Nationality</p><p>{user.country || "—"}</p></div>
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">City</p><p>{user.city || "—"}</p></div>
        <div className="col-span-2"><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Address</p><p>{user.address || "—"}</p></div>
        <div className="col-span-2"><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Emergency Contact</p><p>{user.emergency_contact || "—"}</p></div>
      </div>
    </div>
  );
}

export function SecurityCard({ user, sessions }: { user: AdminUser; sessions?: any[] }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-ink-900/5 shadow-sm space-y-4">
      <h3 className="font-serif text-xl font-medium flex items-center gap-2"><Shield className="size-5" /> Security & Sessions</h3>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-center p-3 bg-ink-900/5 rounded-xl">
          <span>Two-Factor Auth</span>
          <span className={user.two_factor_enabled ? "text-emerald-600 font-medium" : "text-orange-600 font-medium"}>{user.two_factor_enabled ? "Enabled" : "Disabled"}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-ink-900/5 rounded-xl">
          <span>Password Changed</span>
          <span>{user.password_last_changed ? format(new Date(user.password_last_changed), "MMM d, yyyy") : "Never"}</span>
        </div>
        
        <h4 className="font-medium pt-4 border-t">Active Sessions ({sessions?.length || 0})</h4>
        {sessions?.map((sess, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-cream-50/50 rounded-xl border border-ink-900/5">
            {sess.device_type === "Mobile" ? <Smartphone className="size-5 text-ink-900/60" /> : <Monitor className="size-5 text-ink-900/60" />}
            <div className="flex-1">
              <p className="font-medium text-xs">{sess.os} &middot; {sess.browser}</p>
              <p className="text-[10px] text-ink-900/40">{sess.ip} &middot; {format(new Date(sess.login_time), "MMM d, HH:mm")}</p>
            </div>
            {idx === 0 && <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Current</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketingCard({ user }: { user: AdminUser }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-ink-900/5 shadow-sm space-y-4">
      <h3 className="font-serif text-xl font-medium flex items-center gap-2"><Globe className="size-5" /> Marketing Intelligence</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Source</p><p className="capitalize">{user.registration_source || "Organic"}</p></div>
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">UTM Source</p><p>{user.utm_source || "—"}</p></div>
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">UTM Medium</p><p>{user.utm_medium || "—"}</p></div>
        <div><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">UTM Campaign</p><p>{user.utm_campaign || "—"}</p></div>
        <div className="col-span-2"><p className="text-ink-900/40 uppercase tracking-widest text-[10px]">Landing Page</p><p className="truncate text-blue-600">{user.landing_page || "—"}</p></div>
      </div>
    </div>
  );
}

export function MembershipCard({ user }: { user: AdminUser }) {
  return (
    <div className="bg-ink-900 text-cream-50 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
      <h3 className="font-serif text-xl font-medium">Membership & Stats</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-cream-50/60 uppercase tracking-widest text-[10px]">Lifetime Value</p>
          <p className="text-2xl font-semibold text-white mt-1">${user.lifetime_spending?.toLocaleString() || "0.00"}</p>
        </div>
        <div>
          <p className="text-cream-50/60 uppercase tracking-widest text-[10px]">Reward Points</p>
          <p className="text-2xl font-semibold text-[color:var(--gold)] mt-1">{user.reward_points?.toLocaleString() || 0}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
        <div><p className="text-white font-medium">{user.completed_trips || 0}</p><p className="text-[9px] text-cream-50/50 uppercase tracking-widest">Trips</p></div>
        <div><p className="text-white font-medium">{user.reviews_count || 0}</p><p className="text-[9px] text-cream-50/50 uppercase tracking-widest">Reviews</p></div>
        <div><p className="text-white font-medium">{user.coupons_used || 0}</p><p className="text-[9px] text-cream-50/50 uppercase tracking-widest">Coupons</p></div>
      </div>
    </div>
  );
}
