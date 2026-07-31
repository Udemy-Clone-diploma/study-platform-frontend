"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { Input } from "@/shared/ui/Input";
import { LocaleTabs } from "@/shared/ui/LocaleTabs";
import { createCategory, getCategory, updateCategory } from "@/entities/course";
import type { Category, CategoryDetail } from "@/entities/course";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";

const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;
type Locale = "en" | "uk" | "fr" | "es" | "de";
type LocaleFields = Record<Locale, string>;

const EMPTY_LOCALE_FIELDS: LocaleFields = { en: "", uk: "", fr: "", es: "", de: "" };

type Props = {
  category?: Category;
  onClose: () => void;
  onSaved: (category: CategoryDetail) => void;
};

export function CategoryFormModal({ category, onClose, onSaved }: Props) {
  const t = useTranslations("CategoryFormModal");
  const tCommon = useTranslations("Common");
  const [name, setName] = useState<LocaleFields>({ ...EMPTY_LOCALE_FIELDS, en: category?.name ?? "" });
  const [description, setDescription] = useState<LocaleFields>({
    ...EMPTY_LOCALE_FIELDS,
    en: category?.description ?? "",
  });
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [detailLoading, setDetailLoading] = useState(!!category);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    getCategory(category.id)
      .then((detail) => {
        if (cancelled) return;
        setName({
          en: detail.name_en,
          uk: detail.name_uk ?? "",
          fr: detail.name_fr ?? "",
          es: detail.name_es ?? "",
          de: detail.name_de ?? "",
        });
        setDescription({
          en: detail.description_en ?? "",
          uk: detail.description_uk ?? "",
          fr: detail.description_fr ?? "",
          es: detail.description_es ?? "",
          de: detail.description_de ?? "",
        });
        setSlug(detail.slug);
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
  }, [category, t]);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const enName = name.en.trim();
    const trimmedSlug = slug.trim();
    if (!enName) errors.name_en = t("nameRequired");
    else if (enName.length > 100) errors.name_en = t("nameTooLong");
    if (trimmedSlug && trimmedSlug.length > 50) errors.slug = t("slugTooLong");
    else if (trimmedSlug && !SLUG_PATTERN.test(trimmedSlug))
      errors.slug = t("slugInvalid");
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setFormError(null);
    const trimmedSlug = slug.trim();
    const body = {
      name_en: name.en.trim(),
      name_uk: name.uk.trim(),
      name_fr: name.fr.trim(),
      name_es: name.es.trim(),
      name_de: name.de.trim(),
      ...(category || trimmedSlug ? { slug: trimmedSlug } : {}),
      description_en: description.en.trim(),
      description_uk: description.uk.trim(),
      description_fr: description.fr.trim(),
      description_es: description.es.trim(),
      description_de: description.de.trim(),
    };
    try {
      const saved = category
        ? await updateCategory(category.id, body)
        : await createCategory(body);
      onSaved(saved);
    } catch (err) {
      const apiError = err as ApiError;
      setFieldErrors(mapApiFieldErrors(apiError.fields));
      setFormError(apiError.message ?? t("saveError"));
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

  const submitDisabled = loading || detailLoading || !!detailError;

  return (
    <ModalShell
      onClose={onClose}
      closeOnOverlayClick={false}
      title={category ? t("editTitle") : t("addTitle")}
      width="clamp(360px, 38vw, 560px)"
      padding="clamp(20px, 2.08vw, 32px) clamp(24px, 2.5vw, 40px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          <LocaleTabs active={activeLocale} onChange={(l) => setActiveLocale(l as Locale)} filled={filled} />
          {activeLocale !== "en" && (
            <p className="text-xs text-gray-400">
              {t("localeHint")}
            </p>
          )}

          <Input
            id="category-name"
            label={activeLocale === "en" ? t("nameLabel") : t("nameLabelWithLocale", { locale: activeLocale })}
            value={name[activeLocale]}
            onChange={(e) => setName((prev) => ({ ...prev, [activeLocale]: e.target.value }))}
            placeholder={activeLocale !== "en" ? name.en : undefined}
            error={activeLocale === "en" ? fieldErrors.name_en : undefined}
            disabled={detailLoading}
          />

          {activeLocale === "en" && (
            <Input
              id="category-slug"
              label={category ? t("slugLabel") : t("slugLabelOptional")}
              placeholder={
                category
                  ? t("slugPlaceholderEdit")
                  : t("slugPlaceholderCreate")
              }
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              error={fieldErrors.slug}
              disabled={detailLoading}
            />
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="category-description"
              className="text-sm font-medium font-mono text-gray-400"
            >
              {activeLocale === "en" ? t("descriptionLabel") : t("descriptionLabelWithLocale", { locale: activeLocale })}
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={description[activeLocale]}
              onChange={(e) =>
                setDescription((prev) => ({ ...prev, [activeLocale]: e.target.value }))
              }
              placeholder={activeLocale !== "en" ? description.en : undefined}
              disabled={detailLoading}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
            />
          </div>

          {detailError && <p className="text-sm text-red-500">{detailError}</p>}
        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={category ? tCommon("save") : t("createLabel")}
          loading={loading}
          disabled={submitDisabled}
          error={formError}
        />
      </form>
    </ModalShell>
  );
}
