import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldCheck, Mail, Phone, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { AdminUser } from "@/types/admin.users";
import { cn } from "@/lib/utils";

export function ProfileHeader({ user, onEdit }: { user: AdminUser; onEdit: () => void }) {
  return (
    <div className="bg-white/50 backdrop-blur-xl border border-ink-900/[0.08] rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 flex gap-2">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
          user.is_online ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-ink-900/5 text-ink-900/40 border-ink-900/10"
        )}>
          {user.is_online ? <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> : <span className="size-2 rounded-full bg-ink-900/20" />}
          {user.is_online ? "Online" : "Offline"}
        </span>
        <Button variant="outline" size="sm" onClick={onEdit} className="h-8">Edit Profile</Button>
      </div>
      
      <div className="relative group">
        <Avatar className="size-32 rounded-3xl bg-gradient-to-br from-ink-900 to-ink-700 shadow-lg shrink-0">
          <AvatarImage src={user.profile_image?.url} className="object-cover" />
          <AvatarFallback className="text-cream-50 font-serif text-4xl">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-ink-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs font-medium">Update Photo</span>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-4xl font-medium text-ink-900">{user.name}</h1>
          <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
          {user.kyc?.verification_status === "VERIFIED" && <ShieldCheck className="size-5 text-emerald-500" />}
        </div>
        
        <div className="text-ink-900/60 font-mono text-sm mt-1">{user.customer_id || user.id}</div>
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="size-4 text-ink-900/40" />
            <span className="text-ink-900">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="size-4 text-ink-900/40" />
            <span className="text-ink-900">{user.phone_number || "Not provided"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="size-4 text-ink-900/40" />
            <span className="text-ink-900">Since {format(new Date(user.created_at), "MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="size-4 text-ink-900/40" />
            <span className="text-ink-900">{[user.city, user.country].filter(Boolean).join(", ") || "Unknown Location"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
