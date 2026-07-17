import type { SlaLeg, TicketPriority, TicketStatus } from "@/types/admin.enterprise";

export const STATUS_STYLE: Record<TicketStatus, { bg: string; text: string; dot: string; label: string }> = {
  OPEN: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", label: "Open" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
  WAITING_FOR_CUSTOMER: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", label: "Waiting" },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Resolved" },
  CLOSED: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400", label: "Closed" },
  ESCALATED: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "Escalated" },
};

export const PRIORITY_STYLE: Record<TicketPriority, { bg: string; text: string; label: string }> = {
  LOW: { bg: "bg-stone-100", text: "text-stone-600", label: "Low" },
  MEDIUM: { bg: "bg-sky-50", text: "text-sky-700", label: "Medium" },
  HIGH: { bg: "bg-amber-50", text: "text-amber-700", label: "High" },
  URGENT: { bg: "bg-rose-50", text: "text-rose-700", label: "Urgent" },
};

export const SLA_STYLE: Record<SlaLeg["status"], { text: string; label: string }> = {
  MET: { text: "text-emerald-600", label: "Met" },
  ON_TRACK: { text: "text-sky-600", label: "On track" },
  AT_RISK: { text: "text-amber-600", label: "At risk" },
  BREACHED: { text: "text-rose-600", label: "Breached" },
  PENDING: { text: "text-stone-400", label: "Pending" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  BOOKING: "Booking", PAYMENT: "Payment", REFUND: "Refund", ITINERARY: "Itinerary",
  DOCUMENTS: "Documents", TECHNICAL: "Technical", COMPLAINT: "Complaint",
  FEEDBACK: "Feedback", OTHER: "Other",
};
