import { api } from "@/shared/api/base";
import type {
  AdminPayment,
  AdminPaymentList,
  AdminPaymentsParams,
  PaymentSummary,
  RefundPaymentInput,
  RevenueCategoryRow,
  RevenueTimeseriesRow,
  RevenueTrendGroupBy,
} from "../model/admin";

const PAYMENTS_ENDPOINT = "payments/";

type SummaryParams = Omit<AdminPaymentsParams, "page" | "page_size" | "ordering">;

export async function getAdminPayments(
  params: AdminPaymentsParams = {},
): Promise<AdminPaymentList> {
  const { data } = await api.get<AdminPaymentList>(PAYMENTS_ENDPOINT, { params });
  return data;
}

export async function getPaymentsSummary(params: SummaryParams = {}): Promise<PaymentSummary> {
  const { data } = await api.get<PaymentSummary>(`${PAYMENTS_ENDPOINT}summary/`, { params });
  return data;
}

export async function getRevenueTimeseries(
  params: SummaryParams & { group_by?: RevenueTrendGroupBy } = {},
): Promise<RevenueTimeseriesRow[]> {
  const { data } = await api.get<RevenueTimeseriesRow[]>(
    `${PAYMENTS_ENDPOINT}summary/timeseries/`,
    { params },
  );
  return Array.isArray(data) ? data : [];
}

export async function getRevenueByCategory(
  params: SummaryParams = {},
): Promise<RevenueCategoryRow[]> {
  const { data } = await api.get<RevenueCategoryRow[]>(`${PAYMENTS_ENDPOINT}revenue-by-category/`, {
    params,
  });
  return Array.isArray(data) ? data : [];
}

export async function refundPayment(
  paymentId: number,
  body: RefundPaymentInput = {},
): Promise<AdminPayment> {
  const { data } = await api.post<AdminPayment>(`${PAYMENTS_ENDPOINT}${paymentId}/refund/`, body);
  return data;
}
