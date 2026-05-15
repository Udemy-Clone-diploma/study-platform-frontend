import type { CourseListItem } from "../model/types";

export function formatPrice(course: Pick<CourseListItem, "pricing_type" | "price">) {
  if (course.pricing_type === "free" || Number(course.price) === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.price));
}
