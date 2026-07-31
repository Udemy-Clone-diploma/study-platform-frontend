"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { formatPrice } from "@/entities/course";
import type { CourseListItem } from "@/entities/course";
import { CourseStatusBadge } from "./CourseStatusBadge";
import { CourseThumb, formatCourseDate } from "./CoursesTable";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type Props = {
  course: CourseListItem;
  onClose: () => void;
};

export function CourseDetailPanel({ course, onClose }: Props) {
  const t = useTranslations("CourseDetailPanel");
  const tTable = useTranslations("CoursesTable");
  const tLevel = useTranslations("CourseBasicsForm.level");
  const locale = useLocale();

  return (
    <aside
      aria-label={t("courseDetailsAriaLabel")}
      className="flex shrink-0 flex-col rounded-[20px] border border-white bg-(--color-white-20) shadow-(--shadow-usp-glass) backdrop-blur-md"
      style={{
        width: "clamp(300px, 24vw, 360px)",
        padding: "clamp(16px, 1.67vw, 24px)",
        gap: "clamp(14px, 1.25vw, 18px)",
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="overflow-hidden font-bold text-ellipsis whitespace-nowrap text-(--color-text-primary)"
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(16px, 1.25vw, 18px)",
            margin: 0,
          }}
        >
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="underline decoration-from-font hover:text-(--color-blue)"
          >
            {course.title}
          </Link>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeDetailsAriaLabel")}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-(--color-text-secondary) transition hover:bg-(--color-brand-lavender-soft)"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center" style={{ gap: 12 }}>
        <CourseThumb image={course.image} title={course.title} size="clamp(44px, 3.33vw, 56px)" />
        <CourseStatusBadge status={course.status} />
      </div>

      <dl className="flex flex-col" style={{ gap: 10, margin: 0 }}>
        <DetailRow label={t("instructorLabel")}>{course.teacher_name}</DetailRow>
        <DetailRow label={tTable("columnCategory")}>
          {course.category?.name ?? tTable("noCategory")}
        </DetailRow>
        <DetailRow label={t("studentsLabel")}>{course.students_count}</DetailRow>
        <DetailRow label={t("ratingLabel")}>
          {course.rating_count > 0
            ? `${course.rating_avg} (${t("reviewCount", { count: course.rating_count })})`
            : t("noReviewsYet")}
        </DetailRow>
        <DetailRow label={t("priceLabel")}>{formatPrice(course)}</DetailRow>
        <DetailRow label={t("levelLabel")}>
          {course.level in { beginner: 1, intermediate: 1, advanced: 1 }
            ? tLevel(course.level as "beginner" | "intermediate" | "advanced")
            : capitalize(course.level)}
        </DetailRow>
        <DetailRow label={t("languageLabel")}>{capitalize(course.language)}</DetailRow>
        <DetailRow label={t("createdLabel")}>
          {formatCourseDate(course.created_at, locale)}
        </DetailRow>
        {course.published_at && (
          <DetailRow label={t("publishedLabel")}>
            {formatCourseDate(course.published_at, locale)}
          </DetailRow>
        )}
      </dl>
    </aside>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-baseline"
      style={{ gap: 12, fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}
    >
      <dt
        className="shrink-0 text-(--color-text-secondary)"
        style={{ width: "clamp(72px, 5.5vw, 88px)" }}
      >
        {label}
      </dt>
      <dd
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)"
        style={{ margin: 0 }}
      >
        {children}
      </dd>
    </div>
  );
}
