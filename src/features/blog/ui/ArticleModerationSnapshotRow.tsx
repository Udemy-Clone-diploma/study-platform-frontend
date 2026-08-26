import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eye } from "lucide-react";
import { coverCropStyle } from "@/entities/blog";
import type { ArticleModerationSnapshot } from "@/entities/blog";
import { formatDate } from "@/shared/lib/time";
import { ARTICLE_STATUS_COLORS, getArticleStatusLabels } from "../model/articleStatus";

const metaSt: React.CSSProperties = {
  fontFamily: "var(--font-accent)",
  fontWeight: 500,
  fontSize: 12,
  textTransform: "uppercase",
  color: "var(--color-blue)",
};

type Props = { snapshot: ArticleModerationSnapshot };

/** Read-only row for a permanent reject/publish decision. Unlike ArticleRow (which reflects
 * the live, still-mutable Article), this is frozen at the moment of the decision -- the
 * "Current status" badge shows what the live article looks like *now* only as extra context
 * (e.g. a rejected snapshot whose article was since edited and republished). */
export function ArticleModerationSnapshotRow({ snapshot }: Props) {
  const locale = useLocale();
  const t = useTranslations("ArticleModerationSnapshot");
  const tStatus = useTranslations("ArticleStatus");
  const dateLabel = formatDate(snapshot.created_at, locale);
  const currentStatusLabel = getArticleStatusLabels(tStatus)[snapshot.article_status];
  const currentStatusColor = ARTICLE_STATUS_COLORS[snapshot.article_status];

  return (
    <div
      className="flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: "var(--color-border-light)" }}
    >
      <div className="relative shrink-0" style={{ width: "clamp(140px, 18vw, 220px)", aspectRatio: "4 / 3" }}>
        {snapshot.cover_image ? (
          <Image
            src={snapshot.cover_image}
            alt={snapshot.title}
            fill
            unoptimized
            style={coverCropStyle(snapshot.cover_crops.row)}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "var(--shadow-lavander)" }} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2" style={{ minHeight: 20 }}>
            <span style={metaSt}>{dateLabel}</span>
            {currentStatusLabel && (
              <span
                title={t("currentStatusTitle")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontFamily: "var(--font-accent)",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: currentStatusColor,
                  border: `1px solid ${currentStatusColor}`,
                  background: "white",
                }}
              >
                {t("nowStatus", { status: currentStatusLabel })}
              </span>
            )}
          </div>

          <Link
            href={`/blog/${snapshot.article_slug}`}
            aria-label={t("viewCurrentArticleLabel")}
            title={t("viewCurrentArticleLabel")}
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
          {snapshot.title}
        </h3>

        {snapshot.subtitle && (
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
            {snapshot.subtitle}
          </p>
        )}

        {snapshot.decision === "rejected" && snapshot.comment && (
          <p
            style={{
              fontFamily: "var(--font-base)",
              fontSize: 13,
              color: "var(--color-rejected)",
              background: "var(--color-brand-pink)",
              borderRadius: 10,
              padding: "8px 10px",
              margin: 0,
            }}
          >
            {snapshot.comment}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span
            style={{
              fontFamily: "var(--font-base)",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--color-text-primary)",
            }}
          >
            {t("byAuthor", { name: snapshot.author_name })}
          </span>
          {snapshot.moderator_name && (
            <span style={{ fontFamily: "var(--font-base)", fontSize: 12, color: "var(--color-text-secondary)" }}>
              {snapshot.decision === "rejected"
                ? t("rejectedBy", { name: snapshot.moderator_name })
                : t("approvedBy", { name: snapshot.moderator_name })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
