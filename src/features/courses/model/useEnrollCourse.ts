"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { createEnrollment } from "../api/coursesApi";

const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";
const ALREADY_ENROLLED_MESSAGE = "You are already enrolled in this course.";
const ENROLL_FAILED_MESSAGE = "Could not enroll in this course.";

function fieldMessage(error: Partial<ApiError>, field: string): string | undefined {
  const value = error.fields?.[field];
  if (Array.isArray(value)) return value.join(" ");
  return value;
}

function isAlreadyEnrolled(message: string | undefined) {
  return message?.toLowerCase().includes("already enrolled") ?? false;
}

export function useEnrollCourse(courseId: number) {
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
      await createEnrollment(courseId);
      setEnrolled(true);
      router.push("/student-dashboard/courses");
    } catch (err) {
      const apiError = err as Partial<ApiError>;

      if (apiError.status === 401) {
        router.push("/login");
        return;
      }

      const courseError = fieldMessage(apiError, "course_id");
      const serverMessage = courseError || apiError.detail || apiError.message;

      if (isAlreadyEnrolled(serverMessage)) {
        setEnrolled(true);
        setMessage(ALREADY_ENROLLED_MESSAGE);
        return;
      }

      setMessage(serverMessage || ENROLL_FAILED_MESSAGE);
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
