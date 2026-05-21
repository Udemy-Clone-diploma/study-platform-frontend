"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleWishlist } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { AUTH_COOKIE_NAMES } from "@/shared/api/config/authCookies";
import { getClientCookie } from "@/shared/lib/cookies";

type Props = {
  slug: string;
  initialLiked?: boolean;
};

/** Heart button that toggles a course in/out of the student's wishlist */
export function WishlistButton({ slug, initialLiked = false }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const role = getClientCookie(AUTH_COOKIE_NAMES.role);
  if (role && role !== "student") return null;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const { is_wishlisted } = await toggleWishlist(slug);
      setLiked(is_wishlisted);
    } catch (err) {
      const status = (err as Partial<ApiError>).status;
      if (status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      disabled={loading}
      onClick={handleClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-pink-dark) transition hover:scale-110 disabled:opacity-60 sm:h-9 sm:w-9"
    >
      <Heart
        aria-hidden="true"
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill={liked ? "currentColor" : "transparent"}
        strokeWidth={1.75}
      />
    </button>
  );
}
