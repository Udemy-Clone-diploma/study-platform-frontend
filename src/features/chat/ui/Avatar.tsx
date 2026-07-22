"use client";

import { useState } from "react";
import { resolveMediaUrl } from "@/shared/api/lib/mediaUrl";

type Props = {
  src?: string | null;
  label: string;
  size?: "sm" | "md" | "lg" | "xl" | "card";
};

/** Displays a chat avatar with a generated-initials fallback. */
export function Avatar({ src, label, size = "md" }: Props) {
  const dimensions = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-24 w-24 text-2xl",
    card: "h-[55px] w-[55px] text-base",
  }[size];
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const resolvedSrc = resolveMediaUrl(src);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const imageSrc = resolvedSrc && resolvedSrc !== brokenSrc ? resolvedSrc : null;

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={`${dimensions} shrink-0 rounded-full object-cover`}
        referrerPolicy="no-referrer"
        onError={() => setBrokenSrc(imageSrc)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-[#D6E0FF] font-semibold text-[#0B257C]`}
    >
      {initials || "?"}
    </span>
  );
}
