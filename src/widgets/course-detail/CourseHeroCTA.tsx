"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/entities/cart";
import { enrollInFreeCourse, type PricingPlan } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { AccentButton } from "@/shared/ui/AccentButton";

type Props = {
  courseId: number;
  slug: string;
  isEnrolled: boolean;
  defaultPricingPlan: PricingPlan | null;
};

const CART_URL = "/student-dashboard/payment?tab=card";
const COURSE_AVAILABLE_NOTICE = "The course is already available in My Courses.";
const FREE_ENROLLMENT_SUCCESS_NOTICE = "Enrollment complete. You can start this course now.";
const STUDENT_ONLY_MESSAGE = "Enrollment is available only for students.";

/**
 * Hero CTA. A zero-price plan grants access immediately; a paid plan is added
 * to the cart for the regular Stripe checkout flow.
 */
export function CourseHeroCTA({ courseId, slug, isEnrolled, defaultPricingPlan }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const buttonStyle = { width: 200, minWidth: 200, height: 52 } as const;
  const isFreeCourse = defaultPricingPlan !== null && Number(defaultPricingPlan.price) === 0;

  if (enrolled) {
    return (
      <AccentButton size="md" style={buttonStyle} onClick={() => router.push(`/courses/${slug}`)}>
        Go to course
      </AccentButton>
    );
  }

  const handleClick = async () => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    const role = getClientCookie(AUTH_COOKIE_NAMES.role);
    if (role && role !== "student") {
      setNotice(STUDENT_ONLY_MESSAGE);
      return;
    }

    setPending(true);
    setNotice(null);

    try {
      if (isFreeCourse) {
        await enrollInFreeCourse(slug);
        setEnrolled(true);
        setNotice(FREE_ENROLLMENT_SUCCESS_NOTICE);
        return;
      }

      if (defaultPricingPlan) {
        await addCartItem(courseId, defaultPricingPlan.id);
        router.push(CART_URL);
        return;
      }

      setNotice("This course does not have an available pricing plan.");
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      const courseError = String(apiError.fields?.course_id ?? "");

      if (courseError.includes("already in cart")) {
        router.push(CART_URL);
        return;
      }

      if (courseError.includes("already has access")) {
        setEnrolled(true);
        setNotice(COURSE_AVAILABLE_NOTICE);
        return;
      }

      setNotice(apiError.message || apiError.detail || "Could not process your request.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AccentButton size="md" style={buttonStyle} onClick={handleClick} disabled={pending}>
        {pending ? "Processing..." : isFreeCourse ? "Enroll for free" : "Add to cart"}
      </AccentButton>
      {notice && (
        <p role="status" className="max-w-[460px] text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
    </div>
  );
}
