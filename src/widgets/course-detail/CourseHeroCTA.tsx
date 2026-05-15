"use client";

import { useRouter } from "next/navigation";
import { AccentButton } from "@/shared/ui/AccentButton";

type Props = { slug: string };

/** Hero CTA. Logged-out users go to /login with a next param; logged-in users are a no-op until the enrollment flow exists. */
export function CourseHeroCTA({ slug }: Props) {
  const router = useRouter();

  const handleClick = () => {
    const isLoggedIn =
      typeof document !== "undefined" &&
      document.cookie.split("; ").some((c) => c.startsWith("access_token="));
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);
    }
  };

  return (
    <AccentButton size="md" onClick={handleClick}>
      Get Started
    </AccentButton>
  );
}
