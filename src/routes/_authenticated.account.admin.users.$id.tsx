import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { adminUserProfileQuery, adminUserSessionsQuery } from "@/lib/queries";
import { ProfileHeader } from "@/components/admin/users/profile/ProfileHeader";
import { PersonalInfoCard, SecurityCard, MarketingCard, MembershipCard } from "@/components/admin/users/profile/ProfileCards";
import { ActivityTimeline } from "@/components/admin/users/profile/ActivityTimeline";
import { BookingIntelligence } from "@/components/admin/bookings/BookingIntelligence";
import { IntelSummaryStrip } from "@/components/admin/crm/IntelSummaryStrip";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/admin/users/$id")({
  component: AdminUserCRMProfile,
});

function AdminUserCRMProfile() {
  const { id } = Route.useParams();
  
  // Parallel Queries
  const { data: profileData, isLoading: profileLoading } = useQuery(adminUserProfileQuery(id));
  const { data: sessions, isLoading: sessionsLoading } = useQuery(adminUserSessionsQuery(id));

  if (profileLoading) return <div className="p-12 text-center text-ink-900/40 animate-pulse">Loading CRM Profile...</div>;
  if (!profileData) return <div className="p-12 text-center text-red-500">Failed to load user profile.</div>;

  const { user } = profileData;

  return (
    <div className="space-y-8 pb-10">
      <Link 
        to="/account/admin/users" 
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-900/40 hover:text-ink-900 transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back to Users
      </Link>

      <ProfileHeader user={user} onEdit={() => toast.info("Profile editor opening...")} />

      {/* Live Customer Intelligence — health / loyalty / fraud */}
      <IntelSummaryStrip userId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Core Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <PersonalInfoCard user={user} />
             <MarketingCard user={user} />
          </div>
        </div>

        {/* Right Column - Intelligence */}
        <div className="space-y-8">
          <MembershipCard user={user} />
          <SecurityCard user={user} sessions={sessions} />
          <ActivityTimeline userId={user.id} />
        </div>
      </div>

      {/* Full-width Booking Operations Center */}
      <BookingIntelligence userId={user.id} />
    </div>
  );
}
