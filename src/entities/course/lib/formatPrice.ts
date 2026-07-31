import type { PublicCourseListItem } from "../model/public";

/** Format the headline price for a public course card. */
export function formatPrice(
  course: Pick<PublicCourseListItem, "price" | "currency">,
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
