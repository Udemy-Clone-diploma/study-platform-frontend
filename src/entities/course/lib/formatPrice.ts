import type { CourseListItem } from "../model/types";

/** Format the headline (cheapest plan) price for a course card. Returns `freeLabel` when the course has no priced plan. */
export function formatPrice(
  course: Pick<CourseListItem, "price" | "currency">,
  freeLabel = "Free",
  locale = "en-US",
): string {
  if (course.price == null || Number(course.price) === 0) {
    return freeLabel;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: course.currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.price));
}
