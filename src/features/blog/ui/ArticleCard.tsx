"use client";

import Image from "next/image";
import Link from "next/link";
import type { ArticleListItem } from "@/entities/blog";

/** Blog article card for the public /blog category rows — cover image, gradient info panel,
 * and an arrow link through to the article page. Always a fixed 460x520 box regardless of
 * the cover photo. Management (edit/withdraw/archive/etc.) lives on the article's own page
 * (see ArticleDetailView) and on the dashboard row cards (see ArticleRow), not here. */
export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <div
      style={{
        position: "relative",
        width: 460,
        height: 520,
        borderRadius: 24,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {article.cover_image ? (
        <Image
          src={article.cover_image}
          alt={article.title}
          fill
          unoptimized
          style={{ objectFit: "cover", objectPosition: "center top", zIndex: 0 }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "var(--shadow-lavander)", zIndex: 0 }} />
      )}

      <div className="flex items-start justify-end" style={{ position: "relative", zIndex: 2, padding: 20 }}>
        <Link href={`/blog/${article.slug}`} style={{ display: "block" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--color-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image src="/icons/arrow-goto.png" alt="" width={18} height={18} style={{ width: 15, height: "auto" }} />
          </div>
        </Link>
      </div>

      <Link
        href={`/blog/${article.slug}`}
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--gradient-brand)",
          padding: "29px 20px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: 20,
            lineHeight: "25px",
            color: "var(--color-text-primary)",
            overflowWrap: "break-word",
          }}
        >
          {article.title}
        </span>
        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "18px",
            color: "var(--color-text-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "break-word",
          }}
        >
          {article.subtitle}
        </span>
      </Link>
    </div>
  );
}
