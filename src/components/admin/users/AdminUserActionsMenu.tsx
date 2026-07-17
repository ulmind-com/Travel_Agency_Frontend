import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, ShieldAlert, Ban, Trash2, Key, Eye, UserX, Mail, RefreshCw, LogIn } from "lucide-react";
import type { AdminUser } from "@/types/admin.users";

interface Props {
  user: AdminUser;
  onView: () => void;
  onEdit: () => void;
  onVerify: () => void;
  onSuspend: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onImpersonate: () => void;
}

export function AdminUserActionsMenu({ user, onView, onEdit, onVerify, onSuspend, onBlock, onDelete, onRestore, onImpersonate }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onView}><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit User</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}><Mail className="mr-2 h-4 w-4" /> Send Email</DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {user.kyc?.verification_status !== "VERIFIED" && (
          <DropdownMenuItem onSelect={onVerify}><ShieldAlert className="mr-2 h-4 w-4" /> Verify User</DropdownMenuItem>
        )}
        
        <DropdownMenuItem onSelect={onImpersonate}><LogIn className="mr-2 h-4 w-4" /> Login As User</DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {user.deleted_at ? (
          <DropdownMenuItem onSelect={onRestore} className="text-green-600"><RefreshCw className="mr-2 h-4 w-4" /> Restore User</DropdownMenuItem>
        ) : (
          <>
            {!user.is_suspended && <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onSuspend(); }} className="text-orange-600"><UserX className="mr-2 h-4 w-4" /> Suspend User</DropdownMenuItem>}
            {!user.is_blocked && <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onBlock(); }} className="text-red-600"><Ban className="mr-2 h-4 w-4" /> Block User</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onDelete(); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete User</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
