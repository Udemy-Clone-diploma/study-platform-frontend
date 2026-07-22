"use client";

import Image from "next/image";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { sanitizeCourseHtml } from "@/shared/lib/sanitizeCourseHtml";
import { ArticleActionModals, ArticleCardMenu, useArticleActions } from "@/features/blog";
import { ModeratorNoteBanner } from "@/features/courses";
import type { ArticleDetail, BlogCategory } from "@/entities/blog";
import type { UserRole } from "@/entities/user";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

type Props = {
  article: ArticleDetail;
  categories: BlogCategory[];
  currentUserId: number | null;
  currentUserRole: UserRole | null;
};

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
  const actions = useArticleActions();
  const isOwner = currentUserId != null && currentUserId === article.author.id;
  const isStaff = !!currentUserRole && STAFF_ROLES.includes(currentUserRole);
  const authorIsStaff = STAFF_ROLES.includes(article.author.role as UserRole);

  return (
    <article className="relative isolate flex flex-1 flex-col overflow-hidden bg-(--color-bg)">
      {/* flex-1 (main is now a flex column, see (public)/layout.tsx): short articles would
          otherwise leave <main>'s flex-grown remainder (the gap before the sticky footer)
          unstyled white -- percentage/min-h-full sizing isn't reliable against a flex-grown
          parent, flex-1 is. overflow-hidden (not just -x): clips the decorative molecules
          below instead of letting them spill onto the footer on short pages. */}
      {/* Same background as /blog: Blog_Background.svg, painted at the top, not stretched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: "url('/backgrounds/Blog_Background.svg')",
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <DecorImage src="/backgrounds/00 3.svg" className="top-[8%] left-[-10%] rotate-[138deg] hidden lg:block" />
      <DecorImage src="/backgrounds/00 4.svg" className="top-[42%] right-[-8%] rotate-[-150deg] hidden lg:block" />

      <SectionContainer style={{ paddingTop: "3.6vw", paddingBottom: "5vw", maxWidth: "min(900px, 100%)" }}>
        <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {article.category && (
              <span
                style={{
                  display: "inline-flex",
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
            <h1 style={{ fontFamily: "var(--font-base)", fontWeight: 400, fontSize: "clamp(28px, 3.5vw, 48px)", lineHeight: 1.2, color: "var(--color-text-primary)", margin: 0, overflowWrap: "break-word" }}>
              {article.title}
            </h1>
            <p style={{ fontFamily: "var(--font-base)", fontSize: "clamp(15px, 1.4vw, 20px)", color: "var(--color-text-secondary)", margin: 0, overflowWrap: "break-word" }}>
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

        <div className="flex items-center" style={{ gap: 10, marginBottom: 24 }}>
          {article.author.avatar ? (
            <Image src={article.author.avatar} alt={article.author.name} width={40} height={40} unoptimized style={{ borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-badge-lavender)" }} />
          )}
          <div>
            <p style={{ fontFamily: "var(--font-base)", fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)", margin: 0 }}>
              {article.author.name}
            </p>
            {article.published_at && (
              <p style={{ fontFamily: "var(--font-base)", fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                {new Date(article.published_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {article.cover_image && (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 20, overflow: "hidden", marginBottom: 32 }}>
            <Image src={article.cover_image} alt={article.title} fill unoptimized style={{ objectFit: "cover" }} />
          </div>
        )}

        <div
          style={{ fontFamily: "var(--font-base)", fontSize: "clamp(15px, 1.1vw, 17px)", lineHeight: 1.7, color: "var(--color-text-primary)", overflowWrap: "break-word" }}
          dangerouslySetInnerHTML={{ __html: sanitizeCourseHtml(article.body_html) }}
        />
      </SectionContainer>

      <ArticleActionModals categories={categories} state={actions} />
    </article>
  );
}
