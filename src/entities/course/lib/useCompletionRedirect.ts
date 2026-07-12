"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Once a course is completed, Learn is done for it — send the student back to
 *  My Courses (where the completed card with the certificate now lives) instead
 *  of rendering lesson content. */
export function useCompletionRedirect(isCompleted: boolean | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (isCompleted) {
      router.replace("/student-dashboard/courses");
    }
  }, [isCompleted, router]);
}