import type { CourseListItem } from "@/features/courses/model/types/course";

function formatPrice(course: CourseListItem) {
  if (course.pricing_type === "free" || Number(course.price) === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(course.price));
}

function formatStars(course: CourseListItem) {
  const rating = Math.round(Number(course.rating_avg));
  const filled = Math.min(Math.max(rating, 0), 5);
  const empty = 5 - filled;

  return "★".repeat(filled) + "☆".repeat(empty);
}

type CourseCardProps = {
  course: CourseListItem;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="min-w-[456px] max-w-[456px] flex-none snap-center rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">{course.category?.name ?? "General"}</span>
        <span className="font-semibold text-slate-900">{formatPrice(course)}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950 line-clamp-2">{course.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{course.short_description}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
        <span>{course.teacher_name}</span>
      </div>
      <div className="mt-3 text-amber-500">{formatStars(course)}</div>
    </article>
  );
}
