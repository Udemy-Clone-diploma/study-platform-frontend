"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import type { ArticleFormValues, BlogCategory } from "@/entities/blog";

export const articleFormLabelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  marginBottom: "clamp(8px, 0.83vw, 12px)",
};

export const articleFormInputSt: React.CSSProperties = {
  display: "block",
  width: "100%",
  backgroundColor: "var(--color-input-bg)",
  border: "none",
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const labelClassName = "text-[16px] leading-5 lg:text-[clamp(14px,1.39vw,20px)] lg:leading-[25px]";
const inputClassName =
  "rounded-xl px-4 py-3 text-[16px] leading-6 lg:p-[clamp(12px,1.39vw,20px)] " +
  "lg:text-[clamp(14px,1.39vw,20px)] lg:leading-[25px]";

type Props = {
  values: ArticleFormValues;
  onChange: (values: ArticleFormValues) => void;
  categories: BlogCategory[];
  existingCoverImageUrl?: string | null;
};

/** Title / short info / category / cover upload / rich-text summary fields, shared by the
 * edit modal (ArticleFormModal) and the full-page article creation flow. */
export function ArticleFormFields({ values, onChange, categories, existingCoverImageUrl }: Props) {
  const t = useTranslations("ArticleFormFields");
  const [coverPreview, setCoverPreview] = useState<string | null>(existingCoverImageUrl ?? null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange({ ...values, cover_image: file });
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-[clamp(16px,1.39vw,20px)]">
      <div>
        <label htmlFor="article-title" className={labelClassName} style={articleFormLabelSt}>
          {t("titleLabel")}
        </label>
        <input
          id="article-title"
          type="text"
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
          placeholder={t("textPlaceholder")}
          required
          className={inputClassName}
          style={articleFormInputSt}
        />
      </div>

      <div>
        <label htmlFor="article-subtitle" className={labelClassName} style={articleFormLabelSt}>
          {t("shortInfoLabel")}
        </label>
        <input
          id="article-subtitle"
          type="text"
          value={values.subtitle}
          onChange={(e) => onChange({ ...values, subtitle: e.target.value })}
          placeholder={t("textPlaceholder")}
          required
          className={inputClassName}
          style={articleFormInputSt}
        />
      </div>

      <div className="hidden lg:block">
        <label htmlFor="article-category" className={labelClassName} style={articleFormLabelSt}>
          {t("categoryLabel")}
        </label>
        <select
          id="article-category"
          value={values.category ?? ""}
          onChange={(e) =>
            onChange({ ...values, category: e.target.value ? Number(e.target.value) : null })
          }
          className={inputClassName}
          style={{ ...articleFormInputSt, appearance: "auto" as const }}
        >
          <option value="">{t("noCategoryOption")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClassName} style={articleFormLabelSt}>
          {t("coverLabel")}
        </label>
        <div
          className="min-h-[300px] lg:min-h-[140px]"
          style={{
            border: "2px dashed var(--color-draft)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "clamp(16px, 1.67vw, 24px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {coverPreview && (
            <Image
              src={coverPreview}
              alt=""
              fill
              unoptimized
              style={{ objectFit: "cover", zIndex: 0 }}
            />
          )}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            {!coverPreview && (
              <>
                <Upload
                  className="h-8 w-8 lg:h-6 lg:w-6"
                  style={{ color: "var(--color-text-secondary)" }}
                />
                <p
                  className="text-center text-[16px] lg:text-[13px]"
                  style={{
                    fontFamily: "var(--font-base)",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {t("uploadImageHint")}
                </p>
                <p
                  className="text-center text-[13px] lg:text-xs"
                  style={{
                    fontFamily: "var(--font-base)",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {t("uploadFormatsHint")}
                </p>
              </>
            )}
            <WhiteButton
              icon={<Upload size={16} />}
              onClick={() => coverInputRef.current?.click()}
              style={{ width: "min(220px, 100%)", minWidth: 0, height: 48 }}
            >
              {t("chooseFileLabel")}
            </WhiteButton>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*,.jfif"
            style={{ display: "none" }}
            onChange={handleCoverChange}
          />
        </div>
      </div>

      <div>
        <label className={labelClassName} style={articleFormLabelSt}>
          {t("summaryLabel")}
        </label>
        <RichTextEditor
          value={values.body_html}
          onChange={(html) => onChange({ ...values, body_html: html })}
          placeholder={t("summaryPlaceholder")}
          minHeight={200}
          hideToolbarOnMobile
          className="[&_.ProseMirror]:!min-h-[320px] lg:[&_.ProseMirror]:!min-h-[200px]"
        />
      </div>
    </div>
  );
}
