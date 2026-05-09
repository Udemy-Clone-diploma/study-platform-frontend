"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

export function WishlistButton() {
  const [liked, setLiked] = useState(false);

  return (
    <button
      type="button"
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      onClick={() => setLiked((prev) => !prev)}
      className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-pink-dark) transition hover:scale-110 sm:h-9 sm:w-9"
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
