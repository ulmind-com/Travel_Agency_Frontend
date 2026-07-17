import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { AdminUserFilters } from "@/types/admin.users";

interface Props {
  filters: AdminUserFilters;
  onFilterChange: (key: keyof AdminUserFilters, value: any) => void;
}

export function AdminUserFiltersComponent({ filters, onFilterChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-900/40" />
        <Input
          placeholder="Search by Name, Email, Phone, or ID..."
          className="pl-9 bg-white/50 backdrop-blur-md border-ink-900/10 focus-visible:ring-brand-500"
          value={filters.search || ""}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>
      <Select value={filters.role || "ALL"} onValueChange={(val) => onFilterChange("role", val)}>
        <SelectTrigger className="w-[160px] bg-white/50 backdrop-blur-md border-ink-900/10">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Roles</SelectItem>
          <SelectItem value="CUSTOMER">Customer</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.status || "ALL"} onValueChange={(val) => onFilterChange("status", val)}>
        <SelectTrigger className="w-[160px] bg-white/50 backdrop-blur-md border-ink-900/10">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
          <SelectItem value="BLOCKED">Blocked</SelectItem>
          <SelectItem value="DELETED">Deleted</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
