"use client";

import Image from "next/image";

type Props = {
  title: string;
  thumbnailUrl: string | null;
  onClick: () => void;
};

/** Real thumbnail of the generated certificate PDF — click opens the full file. */
export function CertificateCard({ title, thumbnailUrl, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-[260/365] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-(--color-bg) shadow-(--shadow-my-courses-card) transition-shadow hover:shadow-[0px_0px_40px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blue)"
      style={{ border: "none", cursor: "pointer", padding: 0, width: "clamp(140px, 14vw, 260px)" }}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          width={260}
          height={365}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="px-3 text-center font-(family-name:--font-base) text-(--color-text-secondary)"
          style={{ fontSize: "clamp(10px, 0.9vw, 13px)" }}
        >
          {title}
        </span>
      )}
    </button>
  );
}
