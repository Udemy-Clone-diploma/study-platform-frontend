"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ArticleListItem } from "@/entities/blog";
import type { UserRole } from "@/entities/user";
import { formatDate } from "@/shared/lib/time";
import { buildArticleMenu, type ArticleMenuAction } from "./ArticleCardMenu";
import { ARTICLE_STATUS_COLORS, getArticleStatusLabels } from "../model/articleStatus";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

type Props = {
  article: ArticleListItem;
  currentUserId?: number | null;
  currentUserRole?: UserRole | null;
  onClose: () => void;
  onAction: (action: ArticleMenuAction, article: ArticleListItem) => void;
};

/** Side panel shown next to the article list (dashboard tabs) — same glass-panel treatment as
 * TeacherApplicationDetailPanel: info sections plus the available action buttons. */
export function ArticleDetailPanel({ article, currentUserId, currentUserRole, onClose, onAction }: Props) {
  const locale = useLocale();
  const t = useTranslations("ArticleDetailPanel");
  const tMenu = useTranslations("ArticleCardMenu");
  const tStatus = useTranslations("ArticleStatus");
  const statusLabels = getArticleStatusLabels(tStatus);
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const authorIsStaff = STAFF_ROLES.includes(article.author.role as UserRole);
  const menuItems = buildArticleMenu(
    {
      status: article.status,
      isOwner,
      isStaff,
      authorIsStaff,
      isAssignedToMe: article.is_assigned_to_me,
    },
    tMenu,
  );

  return (
    <aside
      aria-label={t("articleDetailsAriaLabel")}
      className="flex shrink-0 flex-col overflow-y-auto rounded-[20px] border border-white bg-(--color-white-20) shadow-(--shadow-usp-glass) backdrop-blur-md"
      style={{
        width: "clamp(320px, 26vw, 400px)",
        padding: "clamp(16px, 1.67vw, 24px)",
        gap: "clamp(14px, 1.25vw, 18px)",
        // Stays pinned to the viewport as the (possibly much taller) row list scrolls, instead
        // of opening flush with the top of the flex row wherever that happens to be scrolled to.
        position: "sticky",
        top: "clamp(16px, 1.67vw, 24px)",
        maxHeight: "calc(100vh - clamp(32px, 3.34vw, 48px))",
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <h2
          className="overflow-hidden font-bold text-ellipsis whitespace-nowrap text-(--color-text-primary)"
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(16px, 1.25vw, 18px)", margin: 0 }}
        >
          {article.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeDetailsAriaLabel")}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-(--color-text-secondary) transition hover:bg-(--color-brand-lavender-soft)"
        >
          <X size={18} />
        </button>
      </div>

      <span
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "4px 12px",
          borderRadius: 20,
          fontFamily: "var(--font-accent)",
          fontWeight: 600,
          fontSize: 12,
          textTransform: "uppercase",
          color: ARTICLE_STATUS_COLORS[article.status],
          border: `1px solid ${ARTICLE_STATUS_COLORS[article.status]}`,
          background: "white",
        }}
      >
        {statusLabels[article.status]}
      </span>

      {article.cover_image && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 12, overflow: "hidden" }}>
          <Image src={article.cover_image} alt="" fill unoptimized style={{ objectFit: "cover" }} />
        </div>
      )}

      <PanelSection title={t("detailsSectionTitle")}>
        <DetailRow label={t("categoryLabel")}>{article.category?.name ?? "—"}</DetailRow>
        <DetailRow label={t("authorLabel")}>{article.author.name}</DetailRow>
        <DetailRow label={t("publishedLabel")}>
          {article.published_at ? formatDate(article.published_at, locale) : "—"}
        </DetailRow>
      </PanelSection>

      {article.subtitle && <DetailTextRow label={t("descriptionLabel")}>{article.subtitle}</DetailTextRow>}

      {menuItems.length > 0 && (
        <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
          {menuItems.map((item) => (
            <PillActionButton
              key={item.action}
              color={
                item.danger
                  ? "var(--color-rejected)"
                  : item.action === "approve" || item.action === "publish"
                    ? "var(--color-success)"
                    : "var(--color-text-primary)"
              }
              icon={<item.Icon size={13} />}
              onClick={() => onAction(item.action, article)}
            >
              {item.label}
            </PillActionButton>
          ))}
        </div>
      )}
    </aside>
  );
}

/** Outlined uppercase pill button, icon trailing the label — same style as the review moderation
 * queue's Reject/Approve buttons. */
function PillActionButton({
  color,
  icon,
  onClick,
  children,
}: {
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full font-semibold uppercase transition hover:opacity-75"
      style={{
        gap: 6,
        padding: "clamp(5px, 0.42vw, 8px) clamp(12px, 1.04vw, 18px)",
        fontSize: "clamp(10px, 0.78vw, 13px)",
        letterSpacing: "0.06em",
        border: `1px solid ${color}`,
        color,
        background: "white",
      }}
    >
      {children}
      {icon}
    </button>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <h3
        className="font-bold text-(--color-blue)"
        style={{ fontFamily: "var(--font-base)", fontSize: "clamp(14px, 1.11vw, 16px)", margin: 0 }}
      >
        {title}
      </h3>
      <dl className="flex flex-col" style={{ gap: 8, margin: 0 }}>
        {children}
      </dl>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline" style={{ gap: 12, fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}>
      <dt className="shrink-0 text-(--color-text-secondary)" style={{ width: "clamp(90px, 7vw, 110px)" }}>
        {label}
      </dt>
      <dd className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-(--color-text-primary)" style={{ margin: 0 }}>
        {children}
      </dd>
    </div>
  );
}

function DetailTextRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-base)", fontSize: "clamp(13px, 0.97vw, 15px)" }}>
      <dt className="mb-1 text-(--color-text-secondary)">{label}</dt>
      <dd className="text-(--color-text-primary)" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {children}
      </dd>
    </div>
  );
}
