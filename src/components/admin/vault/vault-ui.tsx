import {
  FileArchive, FileText, IdCard, Image as ImageIcon, Plane, QrCode,
  Receipt, ShieldCheck, Ticket, type LucideIcon,
} from "lucide-react";
import type { DocCategory } from "@/types/admin.vault";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  PASSPORT: IdCard, VISA: IdCard, AADHAR: IdCard, PAN: IdCard,
  DRIVING_LICENSE: IdCard, GOVERNMENT_ID: IdCard, ADDRESS_PROOF: FileText,
  INSURANCE: ShieldCheck, TRAVEL_PERMIT: FileText, INVOICE: Receipt,
  PAYMENT_RECEIPT: Receipt, TICKET: Ticket, FLIGHT_TICKET: Plane,
  QR_IMAGE: QrCode, TRAVEL_VOUCHER: Ticket, HOTEL_VOUCHER: Ticket, OTHER: FileText,
};

export function categoryIcon(cat: DocCategory | string): LucideIcon {
  return CATEGORY_ICON[cat] ?? FileText;
}

export function fileGlyph(resourceType: string, format?: string | null): LucideIcon {
  if (resourceType === "image") return ImageIcon;
  if (format === "zip") return FileArchive;
  return FileText;
}

export function prettyCategory(cat: string): string {
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function VerificationBadge({ status }: { status: string }) {
  const style = status === "VERIFIED" ? "bg-emerald-50 text-emerald-700"
    : status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", style)}>
      {status}
    </span>
  );
}
