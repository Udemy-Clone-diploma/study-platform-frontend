"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { fluid3 } from "@/shared/lib/fluidScale";
import { ArticleCardMenu, type ArticleMenuAction } from "./ArticleCardMenu";
import { ARTICLE_STATUS_COLORS, ARTICLE_STATUS_LABELS } from "../model/articleStatus";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

type Props = {
  article: ArticleListItem;
  /** When provided (with onAction), a status badge and management menu render on the card --
   * used by the teacher/moderator/admin "my articles" grids. Public /blog and /blog/all pages
   * omit these and get a plain card. */
  currentUserId?: number | null;
  currentUserRole?: UserRole | null;
  onAction?: (action: ArticleMenuAction, article: ArticleListItem) => void;
};

/** Square blog article card — cover image, gradient info panel, and an arrow link through to
 * the article page. Fluidly sized between 280x316 (phone) and 460x520 (desktop), regardless
 * of the cover photo. */
export function ArticleCard({ article, currentUserId, currentUserRole, onAction }: Props) {
  const dateLabel = new Date(article.published_at ?? article.created_at).toLocaleDateString();
  const canManage = !!onAction;
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const authorIsStaff = STAFF_ROLES.includes(article.author.role as UserRole);

  return (
    <div
      style={{
        position: "relative",
        width: fluid3(375, 280, 1024, 400, 1920, 460),
        height: fluid3(375, 316, 1024, 452, 1920, 520),
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

      <div className="flex items-start justify-between" style={{ position: "relative", zIndex: 2, padding: 20 }}>
        {canManage ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 10px",
              borderRadius: 20,
              fontFamily: "var(--font-accent)",
              fontWeight: 600,
              fontSize: 11,
              textTransform: "uppercase",
              color: ARTICLE_STATUS_COLORS[article.status],
              border: `1px solid ${ARTICLE_STATUS_COLORS[article.status]}`,
              background: "white",
            }}
          >
            {ARTICLE_STATUS_LABELS[article.status]}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center" style={{ gap: 8 }}>
          {canManage && (
            <ArticleCardMenu
              status={article.status}
              isOwner={isOwner}
              isStaff={isStaff}
              authorIsStaff={authorIsStaff}
              isAssignedToMe={article.is_assigned_to_me}
              onAction={(action) => onAction(action, article)}
            />
          )}
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
        <div className="flex items-center" style={{ gap: 8 }}>
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
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-bg)" }} />
          )}
          <span style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: "clamp(12px, 1.27vw, 13px)", color: "var(--color-text-primary)" }}>
            {article.author.name}
          </span>
          <span style={{ fontFamily: "var(--font-base)", fontSize: "clamp(11px, 1.17vw, 12px)", color: "var(--color-text-primary)", opacity: 0.7 }}>
            {dateLabel}
          </span>
        </div>

        <span
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            fontSize: "clamp(15px, 1.953vw, 20px)",
            lineHeight: 1.25,
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
            fontSize: "clamp(12px, 1.37vw, 14px)",
            lineHeight: 1.3,
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
