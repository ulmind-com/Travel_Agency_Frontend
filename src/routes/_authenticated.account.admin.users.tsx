import { createFileRoute, useNavigate, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminUsersQuery, crmHealthQuery } from "@/lib/queries";
import { HEALTH_STYLE, TIER_STYLE, FRAUD_STYLE } from "@/components/admin/crm/crmBadges";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { AdminUserFiltersComponent } from "@/components/admin/users/AdminUserFilters";
import { AdminUserActionsMenu } from "@/components/admin/users/AdminUserActionsMenu";
import { AdminUserProfileDrawer } from "@/components/admin/users/AdminUserProfileDrawer";
import type { AdminUser, AdminUserFilters } from "@/types/admin.users";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AdminUserFilters>({ skip: 0, limit: 50 });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery(adminUsersQuery(filters));

  // Customer Intelligence overlay for the visible page of users
  const userIds = (data?.users ?? []).map((u) => u.id).join(",");
  const { data: intel } = useQuery({
    ...crmHealthQuery({ user_ids: userIds, page_size: 100 }),
    enabled: userIds.length > 0,
  });
  const intelMap = new Map((intel?.items ?? []).map((r) => [r.user._id, r]));

  // When a child route (e.g. the user CRM profile at /users/$id) is matched,
  // render it instead of the list.
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;

  const handleFilterChange = (key: keyof AdminUserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, skip: 0 }));
  };
  
  const handleAction = (promise: Promise<any>, successMsg: string) => {
    toast.promise(promise, {
      loading: "Processing...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        return successMsg;
      },
      error: (err: any) => err?.response?.data?.detail || "An error occurred"
    });
  };

  const onImpersonate = async (id: string) => {
    try {
      const { access_token } = await adminService.impersonateUser(id);
      localStorage.setItem("ulmind_auth_token", access_token);
      window.dispatchEvent(new Event("ulmind:auth-changed"));
      navigate({ to: "/" });
      toast.success("Successfully impersonated user");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to impersonate");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">User Administration</h2>
          <p className="text-ink-900/60 mt-1">Manage enterprise customers, admins and access.</p>
        </div>
        <Button variant="outline" onClick={() => adminService.exportUsers()}><Download className="w-4 h-4 mr-2"/> Export CSV</Button>
      </div>

      <AdminUserFiltersComponent filters={filters} onFilterChange={handleFilterChange} />

      <div className="bg-white rounded-2xl border border-ink-900/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-ink-900/5">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading users...</TableCell></TableRow>
              ) : data?.users.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-ink-900/60">No users found.</TableCell></TableRow>
              ) : (
                data?.users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/account/admin/users/$id", params: { id: user.id } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profile_image?.url} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-ink-900/60">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"} className="text-[10px]">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.deleted_at ? <Badge variant="outline">Deleted</Badge> : 
                       user.is_blocked ? <Badge variant="destructive">Blocked</Badge> : 
                       user.is_suspended ? <Badge className="bg-orange-500">Suspended</Badge> : 
                       <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>}
                    </TableCell>
                    {(() => {
                      const r = intelMap.get(user.id);
                      if (!r) return <TableCell colSpan={3} className="text-xs text-ink-900/30">—</TableCell>;
                      const hs = HEALTH_STYLE[r.health.category];
                      const ts = TIER_STYLE[r.loyalty.tier];
                      const fs = FRAUD_STYLE[r.fraud.level];
                      return (
                        <>
                          <TableCell>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", hs.bg, hs.text)}>
                              {r.health.score} · {hs.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", ts.bg, ts.text)}>
                              {ts.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", fs.bg, fs.text)}>
                              {fs.label}
                            </span>
                          </TableCell>
                        </>
                      );
                    })()}
                    <TableCell className="text-sm text-ink-900/80">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.booking_count || 0}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <AdminUserActionsMenu
                        user={user}
                        onView={() => { setSelectedUser(user); setIsDrawerOpen(true); }}
                        onEdit={() => toast.info("Edit modal coming soon")}
                        onVerify={() => handleAction(adminService.verifyUser(user.id), "User verified")}
                        onSuspend={() => {
                          const reason = prompt("Reason for suspension:");
                          if (reason) handleAction(adminService.suspendUser(user.id, reason), "User suspended");
                        }}
                        onBlock={() => {
                          const reason = prompt("Reason for blocking:");
                          if (reason) handleAction(adminService.blockUser(user.id, reason), "User blocked");
                        }}
                        onDelete={() => {
                          const reason = prompt("Reason for deletion:");
                          if (reason) handleAction(adminService.deleteUser(user.id, reason), "User deleted");
                        }}
                        onRestore={() => handleAction(adminService.restoreUser(user.id), "User restored")}
                        onImpersonate={() => onImpersonate(user.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <AdminUserProfileDrawer 
        user={selectedUser} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}
