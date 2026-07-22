import type { Paginated, PricingPlan } from "@/entities/course";
import type { Payment, PaymentStatus } from "./types";

export type PaymentMethod = Payment["payment_method"];

export type PaymentPayer = {
  id: number;
  full_name: string;
  email: string;
  avatar: string | null;
};

export type AdminPayment = Payment & {
  user: PaymentPayer | null;
  user_id: number | null;
};

export type AdminPaymentList = Paginated<AdminPayment>;

export type AdminPaymentsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
  course?: string;
  user?: number;
  has_refund?: boolean;
  ordering?: string;
};

export type PaymentPeriodTotals = {
  gross_revenue: string;
  refunded_amount: string;
  net_revenue: string;
  pending_amount: string;
};

export type PaymentCurrencyTotals = PaymentPeriodTotals & {
  currency: PricingPlan["currency"];
};

export type PaymentSummaryCounts = Record<PaymentStatus, number> & {
  total: number;
  partially_refunded: number;
};

export type PaymentSummaryPrevious = {
  date_from: string;
  date_to: string;
  by_currency: PaymentCurrencyTotals[];
  counts: PaymentSummaryCounts;
};

export type PaymentSummary = {
  by_currency: PaymentCurrencyTotals[];
  counts: PaymentSummaryCounts;
  previous: PaymentSummaryPrevious | null;
};

export type RefundPaymentInput = {
  amount?: string;
  reason?: string;
};

export type RevenueTrendGroupBy = "day" | "week" | "month";

export type RevenueTimeseriesRow = {
  period: string;
  currency: PricingPlan["currency"];
  gross_revenue: string;
};

export type RevenueCategoryRow = {
  category_id: number | null;
  category: string | null;
  slug: string | null;
  currency: PricingPlan["currency"];
  gross_revenue: string;
};
