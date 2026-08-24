"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { LocaleTabs } from "@/shared/ui/LocaleTabs";
import { getBlogCategoryDetail } from "@/entities/blog";
import type { BlogCategory, BlogCategoryFormValues } from "@/entities/blog";
import type { ApiError } from "@/shared/api/base";

type Locale = "en" | "uk" | "fr" | "es" | "de";
type LocaleFields = Record<Locale, string>;

const EMPTY_LOCALE_FIELDS: LocaleFields = { en: "", uk: "", fr: "", es: "", de: "" };

const labelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: 14,
  color: "var(--color-text-primary)",
  marginBottom: 8,
};

const inputSt: React.CSSProperties = {
  display: "block",
  width: "100%",
  backgroundColor: "var(--color-input-bg)",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontFamily: "var(--font-base)",
  fontSize: 14,
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

type Props = {
  category?: BlogCategory;
  onClose: () => void;
  onSave: (values: BlogCategoryFormValues) => Promise<void>;
};

/** Administrator-only modal for adding or editing a blog category block. */
export function BlogCategoryFormModal({ category, onClose, onSave }: Props) {
  const t = useTranslations("BlogCategoryFormModal");
  const tCommon = useTranslations("Common");
  const [name, setName] = useState<LocaleFields>({
    ...EMPTY_LOCALE_FIELDS,
    en: category?.name ?? "",
  });
  const [headline, setHeadline] = useState<LocaleFields>({
    ...EMPTY_LOCALE_FIELDS,
    en: category?.headline ?? "",
  });
  const [description, setDescription] = useState<LocaleFields>({
    ...EMPTY_LOCALE_FIELDS,
    en: category?.description ?? "",
  });
  const [order, setOrder] = useState(category?.order ?? 0);
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [detailLoading, setDetailLoading] = useState(!!category);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    getBlogCategoryDetail(category.slug)
      .then((detail) => {
        if (cancelled) return;
        setName({
          en: detail.name_en,
          uk: detail.name_uk ?? "",
          fr: detail.name_fr ?? "",
          es: detail.name_es ?? "",
          de: detail.name_de ?? "",
        });
        setHeadline({
          en: detail.headline_en,
          uk: detail.headline_uk ?? "",
          fr: detail.headline_fr ?? "",
          es: detail.headline_es ?? "",
          de: detail.headline_de ?? "",
        });
        setDescription({
          en: detail.description_en ?? "",
          uk: detail.description_uk ?? "",
          fr: detail.description_fr ?? "",
          es: detail.description_es ?? "",
          de: detail.description_de ?? "",
        });
        setOrder(detail.order);
      })
      .catch(() => {
        if (!cancelled) setDetailError(t("loadError"));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.en.trim() || !headline.en.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSave({
        name_en: name.en.trim(),
        name_uk: name.uk.trim(),
        name_fr: name.fr.trim(),
        name_es: name.es.trim(),
        name_de: name.de.trim(),
        headline_en: headline.en.trim(),
        headline_uk: headline.uk.trim(),
        headline_fr: headline.fr.trim(),
        headline_es: headline.es.trim(),
        headline_de: headline.de.trim(),
        description_en: description.en.trim(),
        description_uk: description.uk.trim(),
        description_fr: description.fr.trim(),
        description_es: description.es.trim(),
        description_de: description.de.trim(),
        order,
      });
    } catch (err) {
      setError((err as ApiError).message ?? t("saveError"));
      setLoading(false);
    }
  }

  const filled: Record<string, boolean> = {
    en: !!name.en.trim(),
    uk: !!name.uk.trim(),
    fr: !!name.fr.trim(),
    es: !!name.es.trim(),
    de: !!name.de.trim(),
  };

  const submitDisabled =
    !name.en.trim() || !headline.en.trim() || loading || detailLoading || !!detailError;

  return (
    <ModalShell
      onClose={onClose}
      title={category ? t("editTitle") : t("addTitle")}
      width="clamp(320px, 34vw, 520px)"
      padding="clamp(20px, 2.08vw, 30px) clamp(20px, 2.08vw, 32px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LocaleTabs
            active={activeLocale}
            onChange={(l) => setActiveLocale(l as Locale)}
            filled={filled}
          />
          {activeLocale !== "en" && (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
              {t("localeHint")}
            </p>
          )}

          <div>
            <label htmlFor="category-name" style={labelSt}>
              {t("nameLabel")}
              {activeLocale === "en" ? "*" : ""}
            </label>
            <input
              id="category-name"
              type="text"
              value={name[activeLocale]}
              onChange={(e) => setName((prev) => ({ ...prev, [activeLocale]: e.target.value }))}
              placeholder={activeLocale !== "en" ? name.en : undefined}
              required={activeLocale === "en"}
              disabled={detailLoading}
              style={inputSt}
            />
          </div>
          <div>
            <label htmlFor="category-headline" style={labelSt}>
              {t("headlineLabel")}
              {activeLocale === "en" ? "*" : ""}
            </label>
            <input
              id="category-headline"
              type="text"
              value={headline[activeLocale]}
              onChange={(e) => setHeadline((prev) => ({ ...prev, [activeLocale]: e.target.value }))}
              placeholder={activeLocale !== "en" ? headline.en : undefined}
              required={activeLocale === "en"}
              disabled={detailLoading}
              style={inputSt}
            />
          </div>
          <div>
            <label htmlFor="category-description" style={labelSt}>
              {t("descriptionLabel")}
            </label>
            <textarea
              id="category-description"
              value={description[activeLocale]}
              onChange={(e) =>
                setDescription((prev) => ({ ...prev, [activeLocale]: e.target.value }))
              }
              placeholder={activeLocale !== "en" ? description.en : undefined}
              disabled={detailLoading}
              rows={3}
              style={{ ...inputSt, resize: "vertical" as const }}
            />
          </div>
          {activeLocale === "en" && (
            <div>
              <label htmlFor="category-order" style={labelSt}>
                {t("orderLabel")}
              </label>
              <input
                id="category-order"
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                style={inputSt}
              />
            </div>
          )}
          {detailError && (
            <p style={{ fontSize: 13, color: "var(--color-danger)", margin: 0 }}>{detailError}</p>
          )}
        </div>

        <ModalFooter
          onCancel={onClose}
          submitLabel={category ? tCommon("save") : t("createLabel")}
          loading={loading}
          disabled={submitDisabled}
          error={error}
        />
      </form>
    </ModalShell>
  );
}
