"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { sanitizeCourseHtml } from "@/shared/lib/sanitizeCourseHtml";
import { formatDate } from "@/shared/lib/time";
import { ArticleActionModals, ArticleCardMenu, useArticleActions } from "@/features/blog";
import { ModeratorNoteBanner } from "@/features/courses";
import { coverCropStyle } from "@/entities/blog";
import type { ArticleDetail, BlogCategory } from "@/entities/blog";
import type { UserRole } from "@/entities/user";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

type Props = {
  article: ArticleDetail;
  categories: BlogCategory[];
  currentUserId: number | null;
  currentUserRole: UserRole | null;
};

/** Highlights a "Prefix: rest" title the same way CatalogHero highlights its lead phrase —
 * titles without a colon just render plain. */
function renderHighlightedTitle(title: string) {
  const colonIndex = title.indexOf(":");
  if (colonIndex === -1) return title;
  return (
    <>
      <span className="bg-(--color-catalog-highlight) px-1 py-0.5 text-(--color-blue)">
        {title.slice(0, colonIndex + 1)}
      </span>
      {title.slice(colonIndex + 1)}
    </>
  );
}

/** Decorative molecule render (same asset/size/position as the article-creation page). */
function DecorImage({ src, className }: { src: string; className: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={716}
      height={605}
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 select-none object-contain ${className}`}
      sizes="716px"
    />
  );
}

/** Full blog article view — cover, author, body, and (for owner/staff) the management menu. */
export function ArticleDetailView({ article, categories, currentUserId, currentUserRole }: Props) {
  const locale = useLocale();
  const actions = useArticleActions();
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const authorIsStaff = STAFF_ROLES.includes(article.author.role as UserRole);

  return (
    <article className="relative isolate -mb-[14px] flex flex-1 flex-col overflow-hidden bg-(--color-bg) pb-[14px] lg:mb-0 lg:pb-0">
      {/* flex-1 (main is now a flex column, see (public)/layout.tsx): short articles would
          otherwise leave <main>'s flex-grown remainder (the gap before the sticky footer)
          unstyled white -- percentage/min-h-full sizing isn't reliable against a flex-grown
          parent, flex-1 is. overflow-hidden (not just -x): clips the decorative molecules
          below instead of letting them spill onto the footer on short pages. The negative
          mobile margin lets this background continue beneath the footer's rounded corners. */}
      {/* Same background as /blog: Blog_Background.svg, painted at the top, not stretched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-cover lg:bg-[length:100%_auto]"
        style={{
          backgroundImage: "url('/backgrounds/Blog_Background.svg')",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <DecorImage
        src="/backgrounds/00 3.svg"
        className="top-[8%] left-[-10%] rotate-[138deg] hidden lg:block"
      />
      <DecorImage
        src="/backgrounds/00 4.svg"
        className="top-[42%] right-[-8%] rotate-[-150deg] hidden lg:block"
      />

      <SectionContainer
        className="pt-6 pb-12 lg:pt-[3.6vw] lg:pb-[5vw]"
        style={{ maxWidth: "min(900px, 100%)" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4 lg:mb-6">
          <div className="flex min-w-0 flex-col gap-2 lg:gap-3">
            {article.category && (
              <span
                className="hidden lg:inline-flex"
                style={{
                  alignSelf: "flex-start",
                  alignItems: "center",
                  padding: "0 10px",
                  height: 25,
                  background: "var(--color-badge-lavender)",
                  borderRadius: 4,
                  fontFamily: "var(--font-accent)",
                  fontWeight: 500,
                  fontSize: 14,
                  textTransform: "uppercase",
                  color: "var(--color-blue)",
                }}
              >
                {article.category.name}
              </span>
            )}
            <h1
              className="text-[21px] leading-[1.12] sm:text-[28px] md:text-[36px] lg:text-[clamp(28px,3.5vw,48px)] lg:leading-[1.2]"
              style={{
                fontFamily: "var(--font-base)",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                margin: 0,
                overflowWrap: "break-word",
              }}
            >
              {renderHighlightedTitle(article.title)}
            </h1>
            <p
              className="text-[12px] leading-[1.3] sm:text-[14px] md:text-[17px] lg:text-[clamp(15px,1.4vw,20px)]"
              style={{
                fontFamily: "var(--font-base)",
                color: "var(--color-text-secondary)",
                margin: 0,
                overflowWrap: "break-word",
              }}
            >
              {article.subtitle}
            </p>
          </div>

          {(isOwner || isStaff) && (
            <ArticleCardMenu
              status={article.status}
              isOwner={isOwner}
              isStaff={isStaff}
              authorIsStaff={authorIsStaff}
              isAssignedToMe={article.is_assigned_to_me}
              onAction={(action) => actions.handleAction(action, article)}
            />
          )}
        </div>

        {isOwner && article.status === "rejected" && article.moderator_comment && (
          <div style={{ marginBottom: 24 }}>
            <ModeratorNoteBanner comment={article.moderator_comment} />
          </div>
        )}

        <div className="flex flex-col">
          <div className="order-2 mb-4 flex items-center gap-2.5 lg:order-1 lg:mb-6">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={40}
                height={40}
                unoptimized
                className="h-7 w-7 rounded-full object-cover lg:h-10 lg:w-10"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-(--color-badge-lavender) lg:h-10 lg:w-10" />
            )}
            <div>
              <p
                className="text-[11px] lg:text-sm"
                style={{
                  fontFamily: "var(--font-base)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {article.author.name}
              </p>
              {article.published_at && (
                <p
                  className="text-[10px] lg:text-[13px]"
                  style={{
                    fontFamily: "var(--font-base)",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {formatDate(article.published_at, locale)}
                </p>
              )}
            </div>
          </div>

          {article.cover_image && (
            <div className="relative order-1 mb-3 aspect-video w-full overflow-hidden rounded-[14px] lg:order-2 lg:mb-8 lg:rounded-[20px]">
              <Image
                src={article.cover_image}
                alt={article.title}
                fill
                unoptimized
                style={coverCropStyle(article.cover_crops.banner)}
              />
            </div>
          )}

          <div
            className="order-3 text-[12px] leading-[1.18] text-(--color-text-primary) sm:text-sm sm:leading-[1.35] md:text-base lg:text-[clamp(15px,1.1vw,17px)] lg:leading-[1.7] [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_li]:my-0.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 lg:[&_h2]:text-2xl lg:[&_h3]:text-xl"
            style={{ fontFamily: "var(--font-base)", overflowWrap: "break-word" }}
            dangerouslySetInnerHTML={{ __html: sanitizeCourseHtml(article.body_html) }}
          />
        </div>
      </SectionContainer>

      <ArticleActionModals categories={categories} state={actions} />
    </article>
  );
}
