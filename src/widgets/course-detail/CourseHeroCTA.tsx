"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollInCourse } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";
import { AccentButton } from "@/shared/ui/AccentButton";

type Props = { slug: string; isEnrolled: boolean };

/**
 * Hero CTA, fixed at the Figma button size (200x52). Logged-out users go to
 * /login; logged-in users call the enrollment endpoint. Paid courses return
 * 402 until the payment flow ships.
 */
export function CourseHeroCTA({ slug, isEnrolled }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const buttonStyle = { width: 200, minWidth: 200, height: 52 } as const;

  if (enrolled) {
    return (
      <AccentButton size="md" style={buttonStyle} disabled>
        Enrolled
      </AccentButton>
    );
  }

  const handleClick = async () => {
    if (!getClientCookie(AUTH_COOKIE_NAMES.access)) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
      return;
    }

    setPending(true);
    setNotice(null);
    try {
      await enrollInCourse(slug);
      setEnrolled(true);
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      if (apiError.status === 409) {
        setEnrolled(true);
      } else if (apiError.status === 402) {
        setNotice("This is a paid course. See the tuition options below.");
      } else {
        setNotice(apiError.message || apiError.detail || "Could not enroll. Please try again.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AccentButton size="md" style={buttonStyle} onClick={handleClick} disabled={pending}>
        Get Started
      </AccentButton>
      {notice && (
        <p role="status" className="max-w-[460px] text-base text-(--color-pink-dark)">
          {notice}
        </p>
      )}
    </div>
  );
}
