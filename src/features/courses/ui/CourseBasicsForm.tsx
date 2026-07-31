"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/entities/course";
import { AccentButton } from "@/shared/ui/AccentButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import { ModeratorNoteBanner } from "./ModeratorNoteBanner";

export const COURSE_ICONS = [
  { name: "automation",    src: "/cources-default-pic/automation-pic.svg" },
  { name: "billing",       src: "/cources-default-pic/billing-pic.svg" },
  { name: "communication", src: "/cources-default-pic/communication-pic.svg" },
  { name: "innovation",    src: "/cources-default-pic/innovation-pic.svg" },
  { name: "intelligence",  src: "/cources-default-pic/intelligence-pic.svg" },
  { name: "workspace",     src: "/cources-default-pic/workspace-pic.svg" },
];

const LEVEL_VALUES = ["beginner", "intermediate", "advanced"] as const;

const fieldCls = (err: boolean) =>
  ["w-full rounded-xl outline-none transition focus:ring-2 focus:ring-(--color-blue)", err ? "ring-2 ring-red-500" : ""]
    .filter(Boolean).join(" ");

const fieldSt = (err: boolean): React.CSSProperties => ({
  background: err ? "var(--color-error-surface)" : "var(--color-input-bg)",
  borderRadius: 12,
  border: "none",
  padding: "clamp(12px, 0.83vw, 16px)",
  fontSize: "clamp(14px, 1.04vw, 20px)",
  fontFamily: "var(--font-base)",
  color: "var(--color-text-primary)",
});

const labelSt: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-base)",
  fontWeight: 700,
  fontSize: "clamp(14px, 1.04vw, 20px)",
  color: "var(--color-text-primary)",
  marginBottom: "clamp(8px, 0.63vw, 12px)",
};

export type CourseBasicsFormValues = {
  title: string;
  short_description: string;
  full_description: string;
  category_id: string;
  level: string;
};

type FieldStatusValue = "approved" | "rejected" | "needs_revision";

type SectionActionValue = "approved" | "needs_revision" | "rejected" | "";

type Props = {
  form: CourseBasicsFormValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  categories: Category[];
  selectedIcon: string | null;
  onIconSelect: (name: string | null) => void;
  fieldErrors: Record<string, string>;
  generalError?: string;
  submitting: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  /** Per-field review statuses from moderator (shown when course needs revision). */
  fieldStatuses?: Record<string, FieldStatusValue>;
  /** Moderator's note for the basics step. */
  moderatorComment?: string;
  /** Moderator's overall action for the basics step. */
  moderatorSectionAction?: SectionActionValue;
  /** Fields that must not be edited — approved by moderator, revision not required.
   *  Values are the `name` attributes of form fields: "title", "short_description",
   *  "full_description", "icon", "category_id", "level". */
  readonlyFields?: Set<string>;
};

function FieldStatusBadge({ status }: { status: FieldStatusValue | undefined }) {
  if (!status) return null;
  const src = status === "approved" ? "/icons/yes.svg" : status === "rejected" ? "/icons/no.svg" : "/icons/refine.svg";
  const alt = status;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={20} height={20} style={{ width: 20, height: 20, flexShrink: 0 }} />
  );
}

function FieldLabelRow({ htmlFor, label, fieldKey, fieldStatuses }: { htmlFor?: string; label: string; fieldKey: string; fieldStatuses?: Record<string, FieldStatusValue> }) {
  const status = fieldStatuses?.[fieldKey];
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: "clamp(8px, 0.63vw, 12px)" }}>
      <label htmlFor={htmlFor} style={{ ...labelSt, marginBottom: 0 }}>{label}</label>
      <FieldStatusBadge status={status} />
    </div>
  );
}

/** Custom dropdown styled to match the form's input fields. */
function FormSelect({ name, value, options, placeholder, disabled, hasError, onSelect }: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (name: string, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const t = useTranslations("CourseBasicsForm");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: hasError ? "var(--color-error-surface)" : "var(--color-input-bg)",
          borderRadius: 12,
          border: hasError ? "2px solid rgb(239 68 68)" : "none",
          padding: "clamp(12px, 0.83vw, 16px)",
          fontSize: "clamp(14px, 1.04vw, 20px)",
          fontFamily: "var(--font-base)",
          color: selected ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          cursor: disabled ? "default" : "pointer",
          textAlign: "left",
          gap: 8,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected?.label ?? placeholder ?? t("selectPlaceholder")}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--color-text-secondary)",
          }}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-bg)",
            borderRadius: 12,
            boxShadow: "var(--shadow-sort-dropdown)",
            zIndex: 50,
            maxHeight: 220,
            overflowY: "auto",
            padding: "4px 0",
            listStyle: "none",
            margin: 0,
          }}
        >
          {options.map(opt => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                onClick={() => { onSelect(name, opt.value); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  fontFamily: "var(--font-base)",
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  color: opt.value === value ? "var(--color-blue)" : "var(--color-text-primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Form card for course basics — shared between new-course and edit-course pages. */
export function CourseBasicsForm({
  form,
  onChange,
  categories,
  selectedIcon,
  onIconSelect,
  fieldErrors,
  generalError,
  submitting,
  submitLabel,
  onCancel,
  cancelLabel,
  fieldStatuses,
  moderatorComment,
  moderatorSectionAction,
  readonlyFields,
}: Props) {
  const t = useTranslations("CourseBasicsForm");
  const LEVELS = LEVEL_VALUES.map((value) => ({ value, label: t(`level.${value}`) }));
  const SECTION_ACTION_LABEL: Record<NonNullable<SectionActionValue>, { label: string; color: string }> = {
    approved:       { label: t("statusApproved"),      color: "var(--color-success)" },
    needs_revision: { label: t("statusNeedsRevision"), color: "var(--color-warning)" },
    rejected:       { label: t("statusRejected"),       color: "var(--color-rejected)" },
    "":             { label: "",                        color: "" },
  };
  const ro = (field: string) => readonlyFields?.has(field) ?? false;
  const roWrap = (field: string): React.CSSProperties => ro(field) ? { opacity: 0.5, pointerEvents: "none" } : {};

  function handleSelectChange(name: string, value: string) {
    onChange({ target: { name, value } } as React.ChangeEvent<HTMLSelectElement>);
  }

  return (
    <SectionCard>
      {generalError && <p className="mb-4 text-sm text-red-500">{generalError}</p>}

      <p
        className="font-(family-name:--font-base) text-(--color-text-primary)"
        style={{ fontSize: "clamp(14px, 1.25vw, 24px)", marginBottom: "clamp(14px, 1.04vw, 20px)" }}
      >
        {t("courseInformation")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 1.25vw, 20px)" }}>

        {/* Title */}
        <div style={roWrap("title")}>
          <FieldLabelRow htmlFor="title" label={t("courseTitle")} fieldKey="field-title" fieldStatuses={fieldStatuses} />
          <input id="title" name="title" value={form.title} onChange={onChange} readOnly={ro("title")} required placeholder={t("untitledCourse")} className={fieldCls(!!fieldErrors.title)} style={fieldSt(!!fieldErrors.title)} />
          {fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
        </div>

        {/* Short Description */}
        <div style={roWrap("short_description")}>
          <FieldLabelRow htmlFor="short_description" label={t("shortDescription")} fieldKey="field-short-description" fieldStatuses={fieldStatuses} />
          <input id="short_description" name="short_description" value={form.short_description} onChange={onChange} readOnly={ro("short_description")} required maxLength={500} placeholder={t("shortDescriptionPlaceholder")} className={fieldCls(!!fieldErrors.short_description)} style={fieldSt(!!fieldErrors.short_description)} />
          {fieldErrors.short_description && <p className="mt-1 text-xs text-red-500">{fieldErrors.short_description}</p>}
        </div>

        {/* Full Description */}
        <div style={roWrap("full_description")}>
          <FieldLabelRow htmlFor="full_description" label={t("fullDescription")} fieldKey="field-full-description" fieldStatuses={fieldStatuses} />
          <textarea id="full_description" name="full_description" value={form.full_description} onChange={onChange} readOnly={ro("full_description")} required rows={5} placeholder={t("fullDescriptionPlaceholder")} className={fieldCls(!!fieldErrors.full_description)} style={{ ...fieldSt(!!fieldErrors.full_description), resize: "vertical" }} />
          {fieldErrors.full_description && <p className="mt-1 text-xs text-red-500">{fieldErrors.full_description}</p>}
        </div>

        {/* Icon picker */}
        <div style={roWrap("icon")}>
          <FieldLabelRow label={t("courseIcon")} fieldKey="field-icon" fieldStatuses={fieldStatuses} />
          <div className="flex items-end" style={{ gap: "clamp(10px, 1.25vw, 20px)" }}>
            {COURSE_ICONS.map((icon) => {
              const isSelected = selectedIcon === icon.name;
              return (
                <button key={icon.name} type="button" onClick={ro("icon") ? undefined : () => onIconSelect(icon.name)} aria-label={icon.name} aria-pressed={isSelected} className="transition-all" style={{ opacity: isSelected ? 1 : 0.5, background: "transparent", border: "none", padding: 0, cursor: ro("icon") ? "default" : "pointer", flexShrink: 0, width: "clamp(44px, 4.06vw, 78px)", height: "clamp(44px, 4.06vw, 78px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon.src} alt={icon.name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Category + Level */}
        <div className="grid grid-cols-2" style={{ gap: "clamp(16px, 2.08vw, 40px)" }}>
          <div style={roWrap("category_id")}>
            <FieldLabelRow label={t("category")} fieldKey="field-category" fieldStatuses={fieldStatuses} />
            <FormSelect
              name="category_id"
              value={form.category_id}
              options={categories.map(c => ({ value: String(c.id), label: c.name }))}
              onSelect={handleSelectChange}
              placeholder={t("selectCategory")}
              disabled={ro("category_id")}
              hasError={!!fieldErrors.category_id}
            />
            {fieldErrors.category_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.category_id}</p>}
          </div>

          <div style={roWrap("level")}>
            <FieldLabelRow label={t("levelLabel")} fieldKey="field-level" fieldStatuses={fieldStatuses} />
            <FormSelect
              name="level"
              value={form.level}
              options={LEVELS}
              onSelect={handleSelectChange}
              placeholder={t("selectLevel")}
              disabled={ro("level")}
              hasError={!!fieldErrors.level}
            />
            {fieldErrors.level && <p className="mt-1 text-xs text-red-500">{fieldErrors.level}</p>}
          </div>
        </div>

        {/* Moderator basics feedback */}
        <ModeratorNoteBanner
          comment={moderatorComment}
          actionLabel={moderatorSectionAction ? SECTION_ACTION_LABEL[moderatorSectionAction].label : undefined}
          actionColor={moderatorSectionAction ? SECTION_ACTION_LABEL[moderatorSectionAction].color : undefined}
        />

        {/* Submit row */}
        <div className={`flex items-center ${onCancel ? "justify-between" : "justify-end"}`} style={{ marginTop: "clamp(8px, 0.63vw, 12px)" }}>
          {onCancel && <WhiteButton onClick={onCancel}>{cancelLabel ?? t("cancel")}</WhiteButton>}
          <AccentButton type="submit" size="md" disabled={submitting}>
            {submitting ? t("saving") : (submitLabel ?? t("continueToCourseContent"))}
          </AccentButton>
        </div>

      </div>
    </SectionCard>
  );
}
