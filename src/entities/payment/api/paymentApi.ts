import { api } from "@/shared/api/base";
import type {
  CheckoutSession,
  Order,
  OrderList,
  Payment,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentList,
  PaymentType,
} from "../model/types";
import type { TeacherOrderStatus, TeacherOrdersData } from "../model/teacherOrders";

const ORDERS_ENDPOINT = "orders/";
const PAYMENTS_ENDPOINT = "payments/";
const PAYOUTS_ENDPOINT = "teacher/payouts/";

export type TeacherPayoutStatus = {
  status: "not_configured" | "incomplete" | "pending" | "active" | "restricted";
  configured: boolean;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  outstanding_requirements: string[];
  disabled_reason: string;
};

export type StripeBalanceAmount = {
  amount: string;
  currency: string;
};

export type StripeConnectedPayout = {
  id: string;
  amount: string;
  currency: string;
  status: "paid" | "pending" | "in_transit" | "failed" | "canceled" | string;
  method: string;
  type: string;
  created: number | null;
  arrival_date: number | null;
  failure_code: string;
  failure_message: string;
};

export type TeacherStripeFinance = {
  configured: boolean;
  available: StripeBalanceAmount[];
  pending: StripeBalanceAmount[];
  payouts: StripeConnectedPayout[];
};

export async function getTeacherStripeFinance(): Promise<TeacherStripeFinance> {
  return (await api.get<TeacherStripeFinance>(`${PAYOUTS_ENDPOINT}finance/`)).data;
}

export async function getTeacherPayoutStatus(): Promise<TeacherPayoutStatus> {
  return (await api.get<TeacherPayoutStatus>(PAYOUTS_ENDPOINT)).data;
}

export async function startTeacherPayoutOnboarding(): Promise<
  TeacherPayoutStatus & { onboarding_url: string }
> {
  return (
    await api.post<TeacherPayoutStatus & { onboarding_url: string }>(
      `${PAYOUTS_ENDPOINT}onboarding/`,
    )
  ).data;
}

export async function refreshTeacherPayoutStatus(): Promise<TeacherPayoutStatus> {
  return (await api.post<TeacherPayoutStatus>(`${PAYOUTS_ENDPOINT}refresh/`)).data;
}

export type CheckoutSessionInput = {
  success_url?: string;
  cancel_url?: string;
  selected_cart_item_ids?: number[];
  payment_type?: PaymentType;
  installments_count?: number;
};

export async function createCheckoutSession(
  body: CheckoutSessionInput = {},
): Promise<CheckoutSession> {
  const { data } = await api.post<CheckoutSession>(`${PAYMENTS_ENDPOINT}checkout-session/`, body);
  return data;
}

export async function createPaymentIntent(body: CheckoutSessionInput = {}): Promise<PaymentIntent> {
  const { data } = await api.post<PaymentIntent>(`${PAYMENTS_ENDPOINT}payment-intent/`, body);
  return data;
}

export async function syncPaymentIntentStatus(body: {
  payment_id: number;
  payment_intent_id: string;
}): Promise<PaymentIntentStatus> {
  const { data } = await api.post<PaymentIntentStatus>(
    `${PAYMENTS_ENDPOINT}payment-intent/sync/`,
    body,
  );
  return data;
}

export async function getPayments(page = 1): Promise<PaymentList> {
  const { data } = await api.get<PaymentList>(PAYMENTS_ENDPOINT, {
    params: { page, page_size: 100 },
  });
  return data;
}

export async function getPayment(id: number): Promise<Payment> {
  const { data } = await api.get<Payment>(`${PAYMENTS_ENDPOINT}${id}/`);
  return data;
}

export async function downloadPaymentReceipt(paymentId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`${PAYMENTS_ENDPOINT}${paymentId}/receipt/`, {
    responseType: "blob",
  });
  return data;
}

export async function getOrders(page = 1): Promise<OrderList> {
  const { data } = await api.get<OrderList>(ORDERS_ENDPOINT, {
    params: { page, page_size: 100 },
  });
  return data;
}

export async function getOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`${ORDERS_ENDPOINT}${id}/`);
  return data;
}

export async function downloadOrderInvoice(orderId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`${ORDERS_ENDPOINT}${orderId}/invoice/`, {
    responseType: "blob",
  });
  return data;
}

export async function createInstallmentCheckoutSession(
  orderId: number,
  installmentId: number,
  body: CheckoutSessionInput = {},
): Promise<CheckoutSession> {
  const { data } = await api.post<CheckoutSession>(
    `${ORDERS_ENDPOINT}${orderId}/installments/${installmentId}/checkout-session/`,
    body,
  );
  return data;
}

export async function createInstallmentPaymentIntent(
  orderId: number,
  installmentId: number,
): Promise<PaymentIntent> {
  const { data } = await api.post<PaymentIntent>(
    `${ORDERS_ENDPOINT}${orderId}/installments/${installmentId}/payment-intent/`,
  );
  return data;
}

export type TeacherOrdersParams = {
  course?: string;
  cohort?: number;
  status?: TeacherOrderStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
};

export async function getTeacherOrders(
  params: TeacherOrdersParams = {},
): Promise<TeacherOrdersData> {
  const { data } = await api.get<TeacherOrdersData>(`${ORDERS_ENDPOINT}teacher/`, { params });
  return data;
}

export async function downloadTeacherOrderInvoice(orderId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`${ORDERS_ENDPOINT}teacher/${orderId}/invoice/`, {
    responseType: "blob",
  });
  return data;
}
