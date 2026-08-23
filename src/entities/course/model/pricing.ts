export type PricingPlan = {
  id: number;
  price: string;
  /** Discounted price when the course is on sale; equals `price` otherwise. */
  final_price: string;
  currency: "USD";
  installment_count: number | null;
  installment_amount: string | null;
  /** Discounted installment amount when the course is on sale; equals `installment_amount` otherwise. */
  final_installment_amount: string | null;
};
