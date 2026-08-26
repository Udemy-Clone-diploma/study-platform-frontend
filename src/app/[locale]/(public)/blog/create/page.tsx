"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Bookmark, X } from "lucide-react";
import { SectionContainer } from "@/shared/ui/SectionContainer";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import { AccentButton } from "@/shared/ui/AccentButton";
import { getMe } from "@/entities/user";
import type { UserRole } from "@/entities/user";
import {
  createArticle,
  DEFAULT_COVER_CROPS,
  getBlogCategories,
  publishOwnArticle,
  submitArticleForReview,
} from "@/entities/blog";
import type { ArticleFormValues, BlogCategory } from "@/entities/blog";
import { ArticleFormFields, articleFormLabelSt } from "@/features/blog";

const STAFF_ROLES: UserRole[] = ["moderator", "administrator"];

const MANAGE_HREF: Partial<Record<UserRole, string>> = {
  teacher: "/teacher-dashboard/blog",
  moderator: "/moderator-dashboard/blog",
  administrator: "/admin/blog",
};

const EMPTY: ArticleFormValues = {
  title: "",
  subtitle: "",
  body_html: "",
  category: null,
  cover_image: null,
  cover_crops: DEFAULT_COVER_CROPS,
};

/** Decorative molecule render (same asset/ratio as CourseDetailView's pricing section, scaled up here). */
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

export default function CreateArticlePage() {
  const router = useRouter();
  const locale = useLocale();
  const [role, setRole] = useState<UserRole | null | undefined>(undefined);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [values, setValues] = useState<ArticleFormValues>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then((user) => setRole(user.role))
      .catch(() => setRole(null));
    getBlogCategories(locale)
      .then(setCategories)
      .catch(() => {});
  }, [locale]);

  const isStaffAuthor = !!role && STAFF_ROLES.includes(role);
  const canCreate = role === "teacher" || isStaffAuthor;
  const submitLabel = isStaffAuthor ? "Publish" : "Send for Review";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.title.trim() || !values.subtitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const article = await createArticle(values);
      if (isStaffAuthor) await publishOwnArticle(article.slug);
      else await submitArticleForReview(article.slug);
      router.push((role && MANAGE_HREF[role]) || "/blog");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    if (!values.title.trim() || !values.subtitle.trim()) return;
    setSavingDraft(true);
    setError(null);
    try {
      // createArticle always creates a draft (see ArticleService.create_article) --
      // saving as draft just skips the publish/submit-for-review step below.
      await createArticle(values);
      router.push((role && MANAGE_HREF[role]) || "/blog");
    } catch {
      setError("Something went wrong. Please try again.");
      setSavingDraft(false);
    }
  }

  return (
    <div className="relative isolate overflow-x-clip bg-(--color-bg)">
      {/* Dedicated background for this page (1920x1726, own white-fade gradient baked in),
          sized to the page width and cropped to its own (shorter) height instead of stretched. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-cover lg:bg-[length:100%_auto]"
        style={{
          backgroundImage: "url('/backgrounds/blog2-Background.svg')",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <DecorImage
        src="/backgrounds/00 3.svg"
        className="top-[8%] left-[-4%] rotate-[138deg] hidden lg:block"
      />
      <DecorImage
        src="/backgrounds/00 4.svg"
        className="top-[42%] right-[-8%] rotate-[-150deg] hidden lg:block"
      />

      <SectionContainer
        className="pt-6 pb-12 lg:pt-[3.6vw] lg:pb-[5vw]"
        style={{ maxWidth: "min(1181px, 100%)" }}
      >
        <div
          className="rounded-[24px] bg-white p-6 lg:rounded-2xl lg:p-[clamp(20px,2.6vw,50px)]"
          style={{ boxShadow: "var(--shadow-dashboard-card)" }}
        >
          {role === undefined ? (
            <p
              style={{
                fontFamily: "var(--font-base)",
                fontSize: 18,
                color: "var(--color-text-secondary)",
                textAlign: "center",
              }}
            >
              Loading...
            </p>
          ) : !canCreate ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-base)",
                  fontSize: 18,
                  color: "var(--color-text-secondary)",
                  marginBottom: 24,
                }}
              >
                Only teachers, moderators and administrators can publish articles.
              </p>
              <AccentButton href="/blog" size="md" style={{ minWidth: "unset" }}>
                Back to Blog
              </AccentButton>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Bookmark
                    className="h-6 w-6 lg:h-7 lg:w-7"
                    style={{ color: "var(--color-text-primary)" }}
                  />
                  <h1
                    className="text-[20px] leading-6 lg:text-[28px] lg:leading-8"
                    style={{ ...articleFormLabelSt, marginBottom: 0 }}
                  >
                    Add Article
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/blog")}
                  aria-label="Close article creation"
                  className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-gray-100 lg:hidden"
                >
                  <X className="h-6 w-6" aria-hidden />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <ArticleFormFields values={values} onChange={setValues} categories={categories} />

                <div className="mt-8 border-t-2 border-(--color-border-light) pt-6">
                  {error && (
                    <p
                      style={{
                        fontFamily: "var(--font-base)",
                        fontSize: 14,
                        color: "var(--color-danger)",
                        marginBottom: 16,
                        textAlign: "right",
                      }}
                    >
                      {error}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 lg:hidden">
                    <WhiteButton
                      icon={null}
                      onClick={() => router.push("/blog")}
                      disabled={loading || savingDraft}
                      style={{ width: "100%", minWidth: 0, height: 48 }}
                    >
                      Cancel
                    </WhiteButton>
                    <AccentButton
                      type="button"
                      size="md"
                      onClick={handleSaveDraft}
                      disabled={
                        !values.title.trim() || !values.subtitle.trim() || loading || savingDraft
                      }
                      style={{ width: "100%", minWidth: 0, height: 48, paddingInline: 8 }}
                    >
                      {savingDraft ? "Saving…" : "Save"}
                    </AccentButton>
                  </div>

                  <div className="hidden items-center justify-end gap-5 lg:flex">
                    <WhiteButton
                      icon={null}
                      onClick={() => router.push("/blog")}
                      disabled={loading || savingDraft}
                      style={{ minWidth: 160, height: 48 }}
                    >
                      Cancel
                    </WhiteButton>
                    <WhiteButton
                      icon={null}
                      onClick={handleSaveDraft}
                      disabled={
                        !values.title.trim() || !values.subtitle.trim() || loading || savingDraft
                      }
                      style={{ minWidth: 160, height: 48 }}
                    >
                      {savingDraft ? "Saving…" : "Save as Draft"}
                    </WhiteButton>
                    <AccentButton
                      type="submit"
                      size="md"
                      disabled={
                        !values.title.trim() || !values.subtitle.trim() || loading || savingDraft
                      }
                      style={{ minWidth: 160, height: 48 }}
                    >
                      {loading ? "Saving…" : submitLabel}
                    </AccentButton>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </SectionContainer>
    </div>
  );
}
