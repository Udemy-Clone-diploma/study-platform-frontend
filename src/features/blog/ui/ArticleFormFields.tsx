"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { RichTextEditor } from "@/shared/ui/RichTextEditor";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import { COVER_CROP_SLOTS, DEFAULT_COVER_CROPS } from "@/entities/blog";
import type { ArticleFormValues, BlogCategory, CoverCrop, CoverCropSlot } from "@/entities/blog";

const SLOT_LABEL_KEYS: Record<CoverCropSlot, string> = {
  card: "cardFormatLabel",
  row: "rowFormatLabel",
  banner: "bannerFormatLabel",
};

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
  // Bumped on every new file pick so each SlotCropper below remounts (fresh
  // pan/zoom) instead of carrying over the previous photo's framing.
  const [coverGeneration, setCoverGeneration] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setCoverGeneration((n) => n + 1);
      setCoverPreview(URL.createObjectURL(file));
      onChange({ ...values, cover_image: file, cover_crops: DEFAULT_COVER_CROPS });
    } else {
      onChange({ ...values, cover_image: file });
    }
  }

  function handleSlotCropped(slot: CoverCropSlot, crop: CoverCrop) {
    onChange({
      ...values,
      cover_crops: { ...(values.cover_crops ?? DEFAULT_COVER_CROPS), [slot]: crop },
    });
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
        {!coverPreview ? (
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
            }}
          >
            <Upload
              className="h-8 w-8 lg:h-6 lg:w-6"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <p
              className="text-center text-[16px] lg:text-[13px]"
              style={{ fontFamily: "var(--font-base)", color: "var(--color-text-secondary)", margin: 0 }}
            >
              {t("uploadImageHint")}
            </p>
            <p
              className="text-center text-[13px] lg:text-xs"
              style={{ fontFamily: "var(--font-base)", color: "var(--color-text-secondary)", margin: 0 }}
            >
              {t("uploadFormatsHint")}
            </p>
            <WhiteButton
              icon={<Upload size={16} />}
              onClick={() => coverInputRef.current?.click()}
              style={{ width: "min(220px, 100%)", minWidth: 0, height: 48 }}
            >
              {t("chooseFileLabel")}
            </WhiteButton>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p
              className="text-[13px]"
              style={{ fontFamily: "var(--font-base)", color: "var(--color-text-secondary)", margin: 0 }}
            >
              {t("repositionHint")}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {COVER_CROP_SLOTS.map(({ id, aspect }) => (
                <SlotCropper
                  key={`${id}-${coverGeneration}`}
                  slot={id}
                  aspect={aspect}
                  label={t(SLOT_LABEL_KEYS[id])}
                  image={coverPreview}
                  initialCrop={(values.cover_crops ?? DEFAULT_COVER_CROPS)[id]}
                  onCropped={handleSlotCropped}
                />
              ))}
            </div>
            <WhiteButton
              icon={<Upload size={16} />}
              onClick={() => coverInputRef.current?.click()}
              style={{ width: "min(220px, 100%)", minWidth: 0, height: 48 }}
            >
              {t("chooseFileLabel")}
            </WhiteButton>
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*,.jfif"
          style={{ display: "none" }}
          onChange={handleCoverChange}
        />
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

/** One independent pan/zoom cropper for a single rendered format (card / row / banner),
 * so a framing that works for a tall card doesn't have to also work for a wide banner. */
function SlotCropper({
  slot,
  aspect,
  label,
  image,
  initialCrop,
  onCropped,
}: {
  slot: CoverCropSlot;
  aspect: number;
  label: string;
  image: string;
  initialCrop: CoverCrop;
  onCropped: (slot: CoverCropSlot, crop: CoverCrop) => void;
}) {
  // Placeholders -- react-easy-crop overwrites both from `initialCroppedAreaPercentages`
  // right after the image loads.
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[12px] font-semibold uppercase tracking-wide"
        style={{ fontFamily: "var(--font-accent)", color: "var(--color-text-secondary)" }}
      >
        {label}
      </span>
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: aspect, borderRadius: 12, background: "#000" }}
      >
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          objectFit="cover"
          minZoom={1}
          maxZoom={4}
          initialCroppedAreaPercentages={initialCrop}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(croppedAreaPercent: Area) =>
            onCropped(slot, {
              x: croppedAreaPercent.x,
              y: croppedAreaPercent.y,
              width: croppedAreaPercent.width,
              height: croppedAreaPercent.height,
            })
          }
        />
      </div>
      <input
        type="range"
        min={1}
        max={4}
        step={0.01}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        aria-label={label}
        className="w-full"
      />
    </div>
  );
}
