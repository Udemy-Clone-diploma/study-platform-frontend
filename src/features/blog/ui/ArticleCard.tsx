"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { fluid3 } from "@/shared/lib/fluidScale";
import { formatDate } from "@/shared/lib/time";
import { ArticleCardMenu, type ArticleMenuAction } from "./ArticleCardMenu";
import { ARTICLE_STATUS_COLORS, getArticleStatusLabels } from "../model/articleStatus";

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

/** Blog article card — cover image, gradient info panel, and an arrow link through to
 * the article page. Fluidly sized between 300x339 (phone) and 460x520 (desktop), regardless
 * of the cover photo. */
export function ArticleCard({ article, currentUserId, currentUserRole, onAction }: Props) {
  const locale = useLocale();
  const tStatus = useTranslations("ArticleStatus");
  const statusLabels = getArticleStatusLabels(tStatus);
  const dateLabel = formatDate(article.published_at ?? article.created_at, locale);
  const canManage = !!onAction;
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const authorIsStaff = STAFF_ROLES.includes(article.author.role as UserRole);

  return (
    <div
      className="relative flex shrink-0 flex-col justify-between overflow-hidden rounded-[14px] lg:rounded-[24px]"
      style={{
        width: fluid3(375, 300, 1024, 400, 1920, 460),
        maxWidth: "80vw",
        aspectRatio: "46 / 52",
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--shadow-lavander)",
            zIndex: 0,
          }}
        />
      )}

      <div className="relative z-[2] flex items-start justify-between p-3 lg:p-5">
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
            {statusLabels[article.status]}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-bg) lg:h-10 lg:w-10">
              <Image
                src="/icons/arrow-goto.png"
                alt=""
                width={18}
                height={18}
                className="h-auto w-3.5 lg:w-[15px]"
              />
            </div>
          </Link>
        </div>
      </div>

      <Link
        href={`/blog/${article.slug}`}
        className="relative z-[1] flex flex-col gap-1.5 px-3.5 pt-3.5 pb-4 lg:gap-2.5 lg:px-5 lg:pt-[29px] lg:pb-[30px]"
        style={{
          background: "var(--gradient-brand)",
        }}
      >
        <div className={`${canManage ? "flex" : "hidden lg:flex"} items-center`} style={{ gap: 8 }}>
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
            <div
              style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-bg)" }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: "clamp(12px, 1.27vw, 13px)",
              color: "var(--color-text-primary)",
            }}
          >
            {article.author.name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontSize: "clamp(11px, 1.17vw, 12px)",
              color: "var(--color-text-primary)",
              opacity: 0.7,
            }}
          >
            {dateLabel}
          </span>
        </div>

        <span
          className="text-[15px] leading-tight lg:text-[clamp(15px,1.953vw,20px)] lg:leading-[1.25]"
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            overflowWrap: "break-word",
          }}
        >
          {article.title}
        </span>
        <span
          className="text-[12px] leading-[15px] lg:text-[clamp(12px,1.37vw,14px)] lg:leading-[1.3]"
          style={{
            fontFamily: "var(--font-base)",
            fontWeight: 400,
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
