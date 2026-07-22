"use client";

import Image from "next/image";
import Link from "next/link";
import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { ArticleCardMenu, type ArticleMenuAction } from "./ArticleCardMenu";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "Under Review",
  rejected: "Rejected",
  archived: "Archived",
};

const metaSt: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontWeight: 500,
  fontSize: 12,
  textTransform: "uppercase",
  color: "var(--color-blue)",
};

type Props = {
  article: ArticleListItem;
  currentUserId?: number | null;
  currentUserRole?: UserRole | null;
  onAction: (action: ArticleMenuAction, article: ArticleListItem) => void;
};

/** Horizontal list row for dashboard article tabs (My Articles / moderation queues) — cover
 * image on the left linking to the article page, title/description/author/category/date and
 * the management menu on the right. */
export function ArticleRow({ article, currentUserId, currentUserRole, onAction }: Props) {
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const authorIsStaff = STAFF_ROLES.includes(article.author.role as UserRole);
  const statusLabel = article.status !== "published" ? STATUS_LABELS[article.status] : null;
  const dateLabel = new Date(article.published_at ?? article.created_at).toLocaleDateString();

  return (
    <div className="flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border border-(--color-border-light) bg-white transition hover:border-(--color-blue)">
      <Link
        href={`/blog/${article.slug}`}
        className="relative block shrink-0"
        style={{ width: "clamp(140px, 18vw, 220px)", aspectRatio: "4 / 3" }}
      >
        {article.cover_image ? (
          <Image src={article.cover_image} alt={article.title} fill unoptimized style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "var(--shadow-lavander)" }} />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2" style={{ minHeight: 20 }}>
            {article.category && <span style={metaSt}>{article.category.name}</span>}
            {statusLabel && (
              <span style={{ ...metaSt, color: "var(--color-text-secondary)" }}>{statusLabel}</span>
            )}
            <span style={{ fontFamily: "var(--font-base)", fontSize: 12, color: "var(--color-text-secondary)" }}>
              {dateLabel}
            </span>
          </div>

          {(isOwner || isStaff) && (
            <ArticleCardMenu
              status={article.status}
              isOwner={isOwner}
              isStaff={isStaff}
              authorIsStaff={authorIsStaff}
              isAssignedToMe={article.is_assigned_to_me}
              onAction={(action) => onAction(action, article)}
            />
          )}
        </div>

        <Link href={`/blog/${article.slug}`}>
          <h3
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(15px, 1.1vw, 18px)",
              color: "var(--color-text-primary)",
              margin: 0,
              overflowWrap: "break-word",
            }}
          >
            {article.title}
          </h3>
        </Link>

        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: 13,
            color: "var(--color-text-secondary)",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "break-word",
          }}
        >
          {article.subtitle}
        </p>

        <div className="mt-auto flex items-center" style={{ gap: 8 }}>
          {article.author.avatar ? (
            <Image
              src={article.author.avatar}
              alt=""
              width={22}
              height={22}
              unoptimized
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-badge-lavender)" }} />
          )}
          <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
            {article.author.name}
          </span>
        </div>
      </div>
    </div>
  );
}
