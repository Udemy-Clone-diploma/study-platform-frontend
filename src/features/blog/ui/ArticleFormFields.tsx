"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import type { ArticleFormValues, BlogCategory } from "@/entities/blog";

export const articleFormLabelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-primary)",
  marginBottom: "clamp(8px, 0.83vw, 12px)",
};

export const articleFormInputSt: React.CSSProperties = {
  display: "block",
  width: "100%",
  backgroundColor: "var(--color-input-bg)",
  border: "none",
  borderRadius: 12,
  padding: "clamp(12px, 1.39vw, 20px)",
  fontFamily: "var(--font-base)",
  fontWeight: 400,
  fontSize: "clamp(14px, 1.39vw, 20px)",
  lineHeight: "25px",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

type Props = {
  values: ArticleFormValues;
  onChange: (values: ArticleFormValues) => void;
  categories: BlogCategory[];
  existingCoverImageUrl?: string | null;
};

/** Title / short info / category / cover upload / rich-text summary fields, shared by the
 * edit modal (ArticleFormModal) and the full-page article creation flow. */
export function ArticleFormFields({ values, onChange, categories, existingCoverImageUrl }: Props) {
  const [coverPreview, setCoverPreview] = useState<string | null>(existingCoverImageUrl ?? null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange({ ...values, cover_image: file });
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 1.39vw, 20px)" }}>
      <div>
        <label htmlFor="article-title" style={articleFormLabelSt}>Title*</label>
        <input
          id="article-title"
          type="text"
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
          placeholder="Text"
          required
          style={articleFormInputSt}
        />
      </div>

      <div>
        <label htmlFor="article-subtitle" style={articleFormLabelSt}>Short information*</label>
        <input
          id="article-subtitle"
          type="text"
          value={values.subtitle}
          onChange={(e) => onChange({ ...values, subtitle: e.target.value })}
          placeholder="Text"
          required
          style={articleFormInputSt}
        />
      </div>

      <div>
        <label htmlFor="article-category" style={articleFormLabelSt}>Category</label>
        <select
          id="article-category"
          value={values.category ?? ""}
          onChange={(e) => onChange({ ...values, category: e.target.value ? Number(e.target.value) : null })}
          style={{ ...articleFormInputSt, appearance: "auto" as const }}
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={articleFormLabelSt}>Article cover</label>
        <div
          style={{
            border: "2px dashed var(--color-draft)",
            borderRadius: 16,
            minHeight: 140,
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
            <Image src={coverPreview} alt="" fill unoptimized style={{ objectFit: "cover", zIndex: 0 }} />
          )}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {!coverPreview && (
              <>
                <Upload size={24} style={{ color: "var(--color-text-secondary)" }} />
                <p style={{ fontFamily: "var(--font-base)", fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                  Upload an image for this article
                </p>
                <p style={{ fontFamily: "var(--font-base)", fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                  PDF, JPG, PNG up to 50MB
                </p>
              </>
            )}
            <WhiteButton
              icon={<Upload size={16} />}
              onClick={() => coverInputRef.current?.click()}
              style={{ minWidth: 200, height: 44 }}
            >
              Choose File
            </WhiteButton>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
        </div>
      </div>

      <div>
        <label style={articleFormLabelSt}>Article Summary</label>
        <RichTextEditor
          value={values.body_html}
          onChange={(html) => onChange({ ...values, body_html: html })}
          placeholder="Enter your text here"
          minHeight={200}
        />
      </div>
    </div>
  );
}
