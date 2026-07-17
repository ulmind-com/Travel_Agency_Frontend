/** Types for the Enterprise Payment Center (admin). */

export interface PaymentDashboard {
  total_payments: number;
  todays_payments: number;
  successful_payments: number;
  pending_payments: number;
  failed_payments: number;
  refund_requests: number;
  completed_refunds: number;
  refunded_amount: number;
  todays_revenue: number;
  monthly_revenue: number;
  lifetime_revenue: number;
  average_transaction_value: number;
  settlement_pending_count: number;
  settlement_pending_amount: number;
  settlement_completed_count: number;
  settlement_completed_amount: number;
  payment_success_rate: number;
  refund_rate: number;
  webhook_failures: number;
  generated_at: string;
}

export interface PaymentRow {
  id: string;
  payment_reference: string;
  booking_id?: string | null;
  user_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  transaction_id?: string | null;
  gateway?: string;
  currency?: string;
  amount?: number;
  gst_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  refund_amount?: number;
  mode?: string;
  status: string;
  retry_count?: number;
  failed_reason?: string | null;
  webhook_status?: string;
  settlement_id?: string | null;
  settlement_status?: string;
  settlement_date?: string | null;
  settlement_amount?: number | null;
  gateway_fee?: number | null;
  gateway_fee_gst?: number | null;
  payment_date?: string | null;
  created_at?: string;
  // joined context
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  booking_reference?: string | null;
  booking_created_at?: string | null;
  travel_start_date?: string | null;
  package_title?: string | null;
  package_thumbnail?: string | null;
  destination?: string | null;
  coupon_code?: string | null;
  invoice_number?: string | null;
  tax_amount?: number | null;
  refund_status: string;
  open_refund_requests?: number;
}

export interface PaymentListResponse {
  total: number;
  skip: number;
  limit: number;
  items: PaymentRow[];
}

export interface PaymentListParams {
  q?: string;
  payment_status?: string;
  mode?: string;
  settlement?: string;
  refund?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: string;
  max_amount?: string;
  coupon?: string;
  sort_by?: string;
  sort_dir?: number;
  skip?: number;
  limit?: number;
}

export interface RefundRecord {
  id: string;
  refund_reference: string;
  amount: number;
  is_partial: boolean;
  reason: string;
  method: string;
  status: string;
  rejection_reason?: string | null;
  razorpay_refund_id?: string | null;
  failure_reason?: string | null;
  requested_at?: string;
  processed_at?: string | null;
}

export interface WebhookLogRecord {
  id: string;
  event: string;
  webhook_id?: string | null;
  razorpay_payment_id?: string | null;
  processing_status: string;
  response_code: number;
  failure_reason?: string | null;
  retry_count: number;
  is_manual_retry: boolean;
  payload_size: number;
  signature_valid?: boolean | null;
  received_at: string;
  payload?: Record<string, unknown> | null;
}

export interface PaymentDetailResponse {
  payment: PaymentRow;
  customer: Record<string, any> | null;
  booking: Record<string, any> | null;
  coupon: Record<string, any> | null;
  refunds: RefundRecord[];
  webhook_logs: WebhookLogRecord[];
  gateway_response: Record<string, any> | null;
  audit_history: Record<string, any>[];
}

export interface PaymentStatistics {
  monthly: { year: number; month: number; revenue: number; count: number }[];
  by_mode: { mode: string; count: number; revenue: number }[];
}
