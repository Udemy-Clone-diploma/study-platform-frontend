import { api } from "@/shared/api/base";
import type { PaymentType } from "../model/types";

export type LiqPayCheckoutRequest = {
  selected_cart_item_ids: number[];
  payment_type: PaymentType;
  installments_count?: number;
};

export type LiqPayCheckoutResponse = {
  checkout_url: string;
  data: string;
  signature: string;
  provider_order_id: string;
  payment_id: number;
  order_id: number;
  installment_id: number | null;
  amount: string;
  currency: string;
};

export type LiqPayStatusResponse = {
  payment_id: number;
  order_id: number | null;
  installment_id: number | null;
  payment_status: string;
  provider_status: string;
};

export async function createLiqPayCheckout(
  payload: LiqPayCheckoutRequest,
): Promise<LiqPayCheckoutResponse> {
  const { data } = await api.post<LiqPayCheckoutResponse>("payments/liqpay/checkout/", payload);

  return data;
}

export async function syncLiqPayStatus(paymentId: number): Promise<LiqPayStatusResponse> {
  const { data } = await api.post<LiqPayStatusResponse>("payments/liqpay/status/sync/", {
    payment_id: paymentId,
  });

  return data;
}
