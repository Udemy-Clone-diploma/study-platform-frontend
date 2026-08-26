"use client";

import { CheckCircle2, Loader2, LogIn } from "lucide-react";
import { useEnrollCourse } from "../model/useEnrollCourse";

type Props = {
  courseSlug: string;
};

/** Button that enrolls the current student into a course. */
export function EnrollButton({ courseSlug }: Props) {
  const { enroll, enrolled, loading, message } = useEnrollCourse(courseSlug);
  const Icon = enrolled ? CheckCircle2 : loading ? Loader2 : LogIn;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={loading || enrolled}
        onClick={enroll}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-(--color-text-primary) px-6 text-base font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Icon
          aria-hidden="true"
          className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
          strokeWidth={1.8}
        />
        {enrolled ? "Enrolled" : loading ? "Enrolling" : "Enroll in course"}
      </button>

      {message ? (
        <p
          className={`text-sm ${enrolled ? "text-green-700" : "text-(--color-pink-dark)"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
