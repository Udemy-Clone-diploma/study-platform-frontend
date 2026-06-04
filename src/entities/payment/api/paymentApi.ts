import { api } from "@/shared/api/base";
import type {
  CheckoutSession,
  Order,
  OrderList,
  Payment,
  PaymentList,
  PaymentType,
} from "../model/types";

const ORDERS_ENDPOINT = "orders/";
const PAYMENTS_ENDPOINT = "payments/";

export type CheckoutSessionInput = {
  success_url?: string;
  cancel_url?: string;
  payment_type?: PaymentType;
  installments_count?: number;
};

export async function createCheckoutSession(
  body: CheckoutSessionInput = {},
): Promise<CheckoutSession> {
  const { data } = await api.post<CheckoutSession>(
    `${PAYMENTS_ENDPOINT}checkout-session/`,
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
