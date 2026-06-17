"use client";

import type { Category } from "@/entities/course";
import { AccentButton } from "@/shared/ui/AccentButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import { WhiteButton } from "@/shared/ui/WhiteButton";
import { ModeratorNoteBanner } from "./ModeratorNoteBanner";

export const COURSE_ICONS = [
  { name: "automation",    src: "/cources-default-pic/automation-pic.png" },
  { name: "billing",       src: "/cources-default-pic/billing-pic.png" },
  { name: "communication", src: "/cources-default-pic/communication-pic.png" },
  { name: "innovation",    src: "/cources-default-pic/innovation-pic.png" },
  { name: "intelligence",  src: "/cources-default-pic/intelligence-pic.png" },
  { name: "workspace",     src: "/cources-default-pic/workspace-pic.png" },
];

const LEVELS = [
  { value: "beginner",     label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced" },
];

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
  price: string;
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
   *  "full_description", "icon", "category_id", "level", "price". */
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

const SECTION_ACTION_LABEL: Record<NonNullable<SectionActionValue>, { label: string; color: string }> = {
  approved:       { label: "Approved",          color: "var(--color-success)" },
  needs_revision: { label: "Requires Revision", color: "var(--color-warning)" },
  rejected:       { label: "Rejected",          color: "var(--color-rejected)" },
  "":             { label: "",                  color: "" },
};

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
  submitLabel = "Continue to Course Content",
  onCancel,
  cancelLabel = "Cancel",
  fieldStatuses,
  moderatorComment,
  moderatorSectionAction,
  readonlyFields,
}: Props) {
  const ro = (field: string) => readonlyFields?.has(field) ?? false;
  const roWrap = (field: string): React.CSSProperties => ro(field) ? { opacity: 0.5, pointerEvents: "none" } : {};

  return (
    <SectionCard>
      {generalError && <p className="mb-4 text-sm text-red-500">{generalError}</p>}

      <p
        className="font-(family-name:--font-base) text-(--color-text-primary)"
        style={{ fontSize: "clamp(14px, 1.25vw, 24px)", marginBottom: "clamp(14px, 1.04vw, 20px)" }}
      >
        Course information
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 1.25vw, 20px)" }}>

        {/* Title */}
        <div style={roWrap("title")}>
          <FieldLabelRow htmlFor="title" label="Course Title*" fieldKey="field-title" fieldStatuses={fieldStatuses} />
          <input id="title" name="title" value={form.title} onChange={onChange} readOnly={ro("title")} required placeholder="Untitled Course" className={fieldCls(!!fieldErrors.title)} style={fieldSt(!!fieldErrors.title)} />
          {fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
        </div>

        {/* Short Description */}
        <div style={roWrap("short_description")}>
          <FieldLabelRow htmlFor="short_description" label="Short Description*" fieldKey="field-short-description" fieldStatuses={fieldStatuses} />
          <input id="short_description" name="short_description" value={form.short_description} onChange={onChange} readOnly={ro("short_description")} required maxLength={500} placeholder="Brief summary shown in course cards and search results..." className={fieldCls(!!fieldErrors.short_description)} style={fieldSt(!!fieldErrors.short_description)} />
          {fieldErrors.short_description && <p className="mt-1 text-xs text-red-500">{fieldErrors.short_description}</p>}
        </div>

        {/* Full Description */}
        <div style={roWrap("full_description")}>
          <FieldLabelRow htmlFor="full_description" label="Full Description*" fieldKey="field-full-description" fieldStatuses={fieldStatuses} />
          <textarea id="full_description" name="full_description" value={form.full_description} onChange={onChange} readOnly={ro("full_description")} required rows={5} placeholder="Detailed description of the course content, goals, and requirements..." className={fieldCls(!!fieldErrors.full_description)} style={{ ...fieldSt(!!fieldErrors.full_description), resize: "vertical" }} />
          {fieldErrors.full_description && <p className="mt-1 text-xs text-red-500">{fieldErrors.full_description}</p>}
        </div>

        {/* Icon picker */}
        <div style={roWrap("icon")}>
          <FieldLabelRow label="Course Icon*" fieldKey="field-icon" fieldStatuses={fieldStatuses} />
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
            <FieldLabelRow htmlFor="category_id" label="Category*" fieldKey="field-category" fieldStatuses={fieldStatuses} />
            <div className="relative">
              <select id="category_id" name="category_id" value={form.category_id} onChange={onChange} disabled={ro("category_id")} required className={`appearance-none ${fieldCls(!!fieldErrors.category_id)}`} style={{ ...fieldSt(!!fieldErrors.category_id), paddingRight: "clamp(32px, 2.08vw, 40px)" }}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--color-text-secondary)" aria-hidden="true">▾</span>
            </div>
            {fieldErrors.category_id && <p className="mt-1 text-xs text-red-500">{fieldErrors.category_id}</p>}
          </div>

          <div style={roWrap("level")}>
            <FieldLabelRow htmlFor="level" label="Level*" fieldKey="field-level" fieldStatuses={fieldStatuses} />
            <div className="relative">
              <select id="level" name="level" value={form.level} onChange={onChange} disabled={ro("level")} required className={`appearance-none ${fieldCls(!!fieldErrors.level)}`} style={{ ...fieldSt(!!fieldErrors.level), paddingRight: "clamp(32px, 2.08vw, 40px)" }}>
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--color-text-secondary)" aria-hidden="true">▾</span>
            </div>
            {fieldErrors.level && <p className="mt-1 text-xs text-red-500">{fieldErrors.level}</p>}
          </div>
        </div>

        {/* Price */}
        <div style={roWrap("price")}>
          <FieldLabelRow htmlFor="price" label="Price (EUR)" fieldKey="field-price" fieldStatuses={fieldStatuses} />
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-secondary)" style={{ fontSize: "clamp(14px, 1.04vw, 20px)", fontFamily: "var(--font-base)" }} aria-hidden="true">€</span>
            <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={onChange} readOnly={ro("price")} className={fieldCls(!!fieldErrors.price)} style={{ ...fieldSt(!!fieldErrors.price), paddingLeft: "clamp(28px, 2.08vw, 36px)" }} />
          </div>
          {fieldErrors.price && <p className="mt-1 text-xs text-red-500">{fieldErrors.price}</p>}
        </div>

        {/* Moderator basics feedback */}
        <ModeratorNoteBanner
          comment={moderatorComment}
          actionLabel={moderatorSectionAction ? SECTION_ACTION_LABEL[moderatorSectionAction].label : undefined}
          actionColor={moderatorSectionAction ? SECTION_ACTION_LABEL[moderatorSectionAction].color : undefined}
        />

        {/* Submit row */}
        <div className={`flex items-center ${onCancel ? "justify-between" : "justify-end"}`} style={{ marginTop: "clamp(8px, 0.63vw, 12px)" }}>
          {onCancel && <WhiteButton onClick={onCancel}>{cancelLabel}</WhiteButton>}
          <AccentButton type="submit" size="md" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </AccentButton>
        </div>

      </div>
    </SectionCard>
  );
}
