"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enrollInCourse } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";

const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";
const ALREADY_ENROLLED_MESSAGE = "You are already enrolled in this course.";
const PAID_COURSE_MESSAGE = "This course requires payment. See pricing on the course page.";
const ENROLL_FAILED_MESSAGE = "Could not enroll in this course.";

export function useEnrollCourse(slug: string) {
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
      await enrollInCourse(slug);
      setEnrolled(true);
      router.push("/student-dashboard/courses");
    } catch (err) {
      const apiError = err as Partial<ApiError>;

      if (apiError.status === 401) {
        router.push("/login");
        return;
      }

      if (apiError.status === 409) {
        setEnrolled(true);
        setMessage(ALREADY_ENROLLED_MESSAGE);
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
