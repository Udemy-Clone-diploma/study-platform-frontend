import type { DeliveryFormatType, Paginated, PricingPlan } from "@/entities/course";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded";

export type PaymentType = "full" | "installments";

export type PaymentInstallmentStatus = "pending" | "processing" | "paid" | "failed" | "canceled";

export type PaymentItem = {
  id: number;
  course_id: number | null;
  pricing_plan_id: number | null;
  course_title: string;
  course_slug: string;
  pricing_plan_kind: DeliveryFormatType | "";
  unit_amount: string;
  currency: PricingPlan["currency"];
  created_at: string;
};

export type OrderItem = PaymentItem;

export type PaymentInstallment = {
  id: number;
  installment_number: number;
  amount: string;
  currency: PricingPlan["currency"];
  due_date: string;
  status: PaymentInstallmentStatus;
  paid_at: string | null;
  is_paid: boolean;
  can_start_payment: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: number;
  total_amount: string;
  currency: PricingPlan["currency"];
  status: OrderStatus;
  payment_type: PaymentType;
  installments_count: number;
  paid_amount: string;
  remaining_amount: string;
  metadata: Record<string, unknown>;
  items: OrderItem[];
  installments: PaymentInstallment[];
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type Payment = {
  id: number;
  order_id: number | null;
  order: Order | null;
  installment_id: number | null;
  installment_number: number | null;
  amount: string;
  refunded_amount: string;
  currency: PricingPlan["currency"];
  status: PaymentStatus;
  payment_method: "stripe" | "liqpay" | "manual";
  description: string;
  checkout_url: string;
  stripe_payment_intent_id: string;
  stripe_session_id: string;
  stripe_customer_id: string;
  receipt_url?: string | null;
  metadata: Record<string, unknown>;
  items: PaymentItem[];
  is_successful: boolean;
  is_pending: boolean;
  can_be_refunded: boolean;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
};

export type CheckoutSession = {
  checkout_url: string;
  session_id: string;
  payment_id: number;
  order_id: number;
  installment_id: number | null;
};

export type PaymentIntent = {
  client_secret: string;
  payment_intent_id: string;
  payment_id: number;
  order_id: number;
  installment_id: number | null;
  amount: string;
  currency: PricingPlan["currency"];
};

export type PaymentIntentStatus = {
  payment_id: number;
  order_id: number | null;
  installment_id: number | null;
  payment_status: PaymentStatus;
  order_status: OrderStatus | null;
  stripe_payment_intent_status: string;
};

export type PaymentList = Paginated<Payment>;
export type OrderList = Paginated<Order>;
