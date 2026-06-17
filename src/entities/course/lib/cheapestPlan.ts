import type { PricingPlan } from "../model/pricing";

/** Lowest-priced plan, or null when the course is free (no plans). */
export function cheapestPlan(plans: readonly PricingPlan[]): PricingPlan | null {
  return plans.reduce<PricingPlan | null>(
    (min, p) => (min === null || Number(p.price) < Number(min.price) ? p : min),
    null,
  );
}
