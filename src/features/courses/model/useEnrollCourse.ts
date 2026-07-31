"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { enrollInFreeCourse } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";

const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";
const PAID_COURSE_MESSAGE = "This course requires payment. See pricing on the course page.";
const ENROLL_FAILED_MESSAGE = "Could not enroll in this course.";
const ENROLL_SUCCESS_MESSAGE = "Enrollment complete. You can find this course in My Courses.";

export function useEnrollCourse(courseSlug: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [message, setMessage] = useState("");

  async function enroll() {
    if (loading || enrolled) return;

    const token = getClientCookie(AUTH_COOKIE_NAMES.access);
    const role = getClientCookie(AUTH_COOKIE_NAMES.role);

    if (!token) {
      router.push("/login");
      return;
    }

    if (role && role !== "student") {
      setMessage(STUDENT_ONLY_MESSAGE);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await enrollInFreeCourse(courseSlug);
      setEnrolled(true);
      setMessage(ENROLL_SUCCESS_MESSAGE);
    } catch (err) {
      const apiError = err as Partial<ApiError>;

      if (apiError.status === 401) {
        router.push("/login");
        return;
      }

      if (apiError.status === 400 || apiError.status === 409) {
        setEnrolled(true);
        setMessage(ENROLL_SUCCESS_MESSAGE);
        return;
      }

      if (apiError.status === 402) {
        setMessage(PAID_COURSE_MESSAGE);
        return;
      }

      setMessage(apiError.detail || apiError.message || ENROLL_FAILED_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return {
    enroll,
    enrolled,
    loading,
    message,
  };
}
