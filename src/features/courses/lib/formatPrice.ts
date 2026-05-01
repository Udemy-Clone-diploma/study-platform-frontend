import type { CourseListItem } from "@/features/courses/model/types/course";

export function formatPrice(course: CourseListItem) {
    if (course.pricing_type === "free" || Number(course.price) === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(course.price));
}
