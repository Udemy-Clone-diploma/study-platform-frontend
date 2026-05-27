import type { CourseListItem } from "../model/types";

/** Format the headline (cheapest plan) price for a course card. Returns "Free" when the course has no priced plan. */
export function formatPrice(course: Pick<CourseListItem, "price" | "currency">): string {
  if (course.price == null || Number(course.price) === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: course.currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.price));
}
