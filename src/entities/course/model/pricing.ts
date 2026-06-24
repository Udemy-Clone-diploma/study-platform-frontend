export type PricingPlan = {
  id: number;
  price: string;
  currency: "USD" | "EUR" | "UAH";
  installment_count: number | null;
  installment_amount: string | null;
};
