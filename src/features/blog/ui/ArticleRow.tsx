"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eye } from "lucide-react";
import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { formatDate } from "@/shared/lib/time";
import { ARTICLE_STATUS_COLORS, getArticleStatusLabels } from "../model/articleStatus";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

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
  isSelected: boolean;
  onSelect: (article: ArticleListItem) => void;
};

/** Horizontal list row for dashboard article tabs (My Articles / moderation queues). The whole
 * row opens the shared ArticleDetailPanel (info + management actions); the small eye icon is a
 * separate link straight through to the article page. */
export function ArticleRow({
  article,
  currentUserId,
  currentUserRole,
  isSelected,
  onSelect,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("ArticleRow");
  const tStatus = useTranslations("ArticleStatus");
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const statusLabel = getArticleStatusLabels(tStatus)[article.status];
  const statusColor = ARTICLE_STATUS_COLORS[article.status];
  const dateLabel = formatDate(article.published_at ?? article.created_at, locale);

  const canManage = isOwner || isStaff;

  return (
    <div
      role={canManage ? "button" : undefined}
      tabIndex={canManage ? 0 : undefined}
      onClick={canManage ? () => onSelect(article) : undefined}
      onKeyDown={
        canManage
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(article);
              }
            }
          : undefined
      }
      aria-pressed={canManage ? isSelected : undefined}
      className="flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border bg-white transition"
      style={{
        borderColor: isSelected ? "var(--color-blue)" : "var(--color-border-light)",
        cursor: canManage ? "pointer" : "default",
      }}
    >
      <div
        className="relative shrink-0"
        style={{ width: "clamp(140px, 18vw, 220px)", aspectRatio: "4 / 3" }}
      >
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            unoptimized
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "var(--shadow-lavander)" }} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2" style={{ minHeight: 20 }}>
            {article.category && <span style={metaSt}>{article.category.name}</span>}
            {statusLabel && (
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
                  color: statusColor,
                  border: `1px solid ${statusColor}`,
                  background: "white",
                }}
              >
                {statusLabel}
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--font-base)",
                fontSize: 12,
                color: "var(--color-text-secondary)",
              }}
            >
              {dateLabel}
            </span>
          </div>

          <Link
            href={`/blog/${article.slug}`}
            aria-label={t("viewArticleLabel")}
            title={t("viewArticleLabel")}
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center justify-center rounded-full transition hover:bg-(--color-brand-lavender-soft)"
            style={{ width: 32, height: 32, background: "var(--color-bg)" }}
          >
            <Eye size={16} style={{ color: "var(--color-text-primary)" }} />
          </Link>
        </div>

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
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--color-badge-lavender)",
              }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--color-text-primary)",
            }}
          >
            {article.author.name}
          </span>
        </div>
      </div>
    </div>
  );
}
