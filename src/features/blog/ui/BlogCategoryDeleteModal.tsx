"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { AccentButton } from "@/shared/ui/AccentButton";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import type { BlogCategory, BlogCategoryDeleteResolution } from "@/entities/blog";

type Props = {
  category: BlogCategory;
  otherCategories: BlogCategory[];
  loading: boolean;
  error: string | null;
  onConfirm: (resolution?: BlogCategoryDeleteResolution) => void;
  onCancel: () => void;
};

/** Delete-confirmation for a blog category. When it still has articles, forces a choice --
 * archive them all or move them to another category -- instead of just failing with a 409. */
export function BlogCategoryDeleteModal({
  category,
  otherCategories,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("BlogCategoryDeleteModal");
  const tCommon = useTranslations("Common");
  const hasArticles = !!category.articles_count;
  const [resolution, setResolution] = useState<"archive" | "move">("archive");
  const [targetSlug, setTargetSlug] = useState(otherCategories[0]?.slug ?? "");

  function handleConfirm() {
    if (!hasArticles) {
      onConfirm();
      return;
    }
    if (resolution === "archive") onConfirm({ type: "archive" });
    else onConfirm({ type: "move", targetCategorySlug: targetSlug });
  }

  const count = category.articles_count ?? 0;

  return (
    <ModalShell
      onClose={onCancel}
      title={t("title")}
      width="clamp(320px, 30vw, 480px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      {hasArticles ? (
        <>
          <p
            className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
            style={{ fontSize: "clamp(13px, 0.97vw, 16px)", lineHeight: 1.5, margin: "0 0 16px" }}
          >
            {t("stillHasArticles", { name: category.name, count })}
          </p>

          <div className="flex flex-col" style={{ gap: 10, marginBottom: 20 }}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                resolution === "archive"
                  ? "border-(--color-blue) bg-(--color-brand-lavender-soft)"
                  : "border-(--color-border-light) hover:bg-(--color-bg-surface)"
              }`}
            >
              <input
                type="radio"
                name="category-delete-resolution"
                checked={resolution === "archive"}
                onChange={() => setResolution("archive")}
                className="accent-(--color-blue)"
              />
              <span className="text-(--color-text-primary)">{t("archiveAll", { count })}</span>
            </label>

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                resolution === "move"
                  ? "border-(--color-blue) bg-(--color-brand-lavender-soft)"
                  : "border-(--color-border-light) hover:bg-(--color-bg-surface)"
              }`}
            >
              <input
                type="radio"
                name="category-delete-resolution"
                checked={resolution === "move"}
                disabled={otherCategories.length === 0}
                onChange={() => setResolution("move")}
                className="accent-(--color-blue)"
              />
              <span className="text-(--color-text-primary)">{t("moveToAnother")}</span>
            </label>

            {resolution === "move" && (
              <select
                value={targetSlug}
                onChange={(e) => setTargetSlug(e.target.value)}
                className="ml-7 rounded-lg border border-(--color-border-light) bg-white px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-blue)"
              >
                {otherCategories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      ) : (
        <p
          className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
          style={{ fontSize: "clamp(13px, 0.97vw, 16px)", lineHeight: 1.5, margin: "0 0 clamp(20px, 1.67vw, 28px)" }}
        >
          {t("deleteConfirm", { name: category.name })}
        </p>
      )}

      {error && (
        <p
          className="font-(family-name:--font-base) text-(--color-danger)"
          style={{ fontSize: "clamp(12px, 0.83vw, 14px)", margin: "0 0 12px" }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-center" style={{ gap: 12 }}>
        <WhiteButton
          icon={null}
          onClick={onCancel}
          disabled={loading}
          style={{ minWidth: "clamp(110px, 9vw, 140px)", height: "clamp(36px, 2.71vw, 44px)", fontSize: "clamp(12px, 0.97vw, 15px)" }}
        >
          {tCommon("cancel")}
        </WhiteButton>
        <AccentButton
          size="md"
          onClick={handleConfirm}
          disabled={loading || (hasArticles && resolution === "move" && !targetSlug)}
          style={{ minWidth: "clamp(110px, 9vw, 140px)", height: "clamp(36px, 2.71vw, 44px)", fontSize: "clamp(12px, 0.97vw, 15px)" }}
        >
          {loading ? tCommon("pleaseWait") : tCommon("delete")}
        </AccentButton>
      </div>
    </ModalShell>
  );
}
