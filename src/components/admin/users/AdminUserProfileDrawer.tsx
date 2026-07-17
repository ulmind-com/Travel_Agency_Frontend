import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/types/admin.users";
import { format } from "date-fns";

interface Props {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminUserProfileDrawer({ user, isOpen, onClose }: Props) {
  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>User Profile</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profile_image?.url} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-ink-900/60">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                {user.is_blocked && <Badge variant="destructive">Blocked</Badge>}
                {user.is_suspended && <Badge className="bg-orange-500">Suspended</Badge>}
                {user.deleted_at && <Badge variant="outline">Deleted</Badge>}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-ink-900/5 rounded-xl">
              <p className="text-xs text-ink-900/60 uppercase tracking-wider">Bookings</p>
              <p className="text-2xl font-semibold mt-1">{user.booking_count || 0}</p>
            </div>
            <div className="p-4 bg-ink-900/5 rounded-xl">
              <p className="text-xs text-ink-900/60 uppercase tracking-wider">Lifetime Value</p>
              <p className="text-2xl font-semibold mt-1">${user.lifetime_spending?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Details</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-ink-900/60">Phone:</span> <span>{user.phone_number || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-ink-900/60">Location:</span> <span>{[user.city, user.country].filter(Boolean).join(", ") || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-ink-900/60">Joined:</span> <span>{format(new Date(user.created_at), "MMM d, yyyy")}</span></div>
              {user.last_login && <div className="flex justify-between"><span className="text-ink-900/60">Last Login:</span> <span>{format(new Date(user.last_login), "MMM d, yyyy HH:mm")}</span></div>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
