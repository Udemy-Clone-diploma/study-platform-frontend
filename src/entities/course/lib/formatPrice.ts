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

/** Format the pre-discount price for strikethrough display. Null when there's nothing to strike through
 *  (course is free, or is_on_sale doesn't actually lower the price). */
export function formatOriginalPrice(
  course: Pick<CourseListItem, "original_price" | "currency">,
  locale = "en-US",
): string | null {
  if (course.original_price == null || Number(course.original_price) === 0) {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: course.currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.original_price));
}
