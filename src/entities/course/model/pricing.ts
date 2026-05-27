export type PricingPlan = {
  id: number;
  kind: "group" | "individual";
  price: string;
  currency: "USD" | "EUR" | "UAH";
  installment_count: number | null;
  installment_amount: string | null;
};
