"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCategories, getCourseBySlug, updateCourse, uploadCourseIcon, getPendingEdit } from "@/entities/course";
import type { Category } from "@/entities/course";
import {
  CourseCreationLayout,
  CourseCreationStepper,
  CourseBasicsCard,
  CourseBasicsForm,
  CoursePageHeader,
  COURSE_ICONS,
} from "@/features/courses";
import type { CourseBasicsFormValues } from "@/features/courses";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";

async function matchIconToImage(imageUrl: string): Promise<string | null> {
  try {
    const [currentRes, ...iconResponses] = await Promise.all([
      fetch(imageUrl),
      ...COURSE_ICONS.map((icon) => fetch(icon.src)),
    ]);
    if (!currentRes.ok) return null;
    const currentArr = new Uint8Array(await currentRes.arrayBuffer());
    const iconBuffers = await Promise.all(iconResponses.map((r) => r.arrayBuffer()));
    for (let i = 0; i < COURSE_ICONS.length; i++) {
      const iconArr = new Uint8Array(iconBuffers[i]);
      if (iconArr.length === currentArr.length && iconArr.every((b, j) => b === currentArr[j]))
        return COURSE_ICONS[i].name;
    }
    return null;
  } catch {
    return null;
  }
}

const EMPTY_FORM: CourseBasicsFormValues = { title: "", short_description: "", full_description: "", category_id: "", level: "" };

const UI_KEY_TO_FIELD: Record<string, string> = {
  "field-title":             "title",
  "field-short-description": "short_description",
  "field-full-description":  "full_description",
  "field-icon":              "icon",
  "field-category":          "category_id",
  "field-level":             "level",
};

/** Returns the set of field names that are read-only (approved by moderator, no revision needed). */
function buildReadonlyFields(statuses: Record<string, string>): Set<string> {
  const result = new Set<string>();
  for (const [uiKey, fieldName] of Object.entries(UI_KEY_TO_FIELD)) {
    if (statuses[uiKey] !== "needs_revision") result.add(fieldName);
  }
  return result;
}

const PUBLISHED_STATUSES = new Set(["published", "hidden"]);

export default function EditCourseBasicsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const loadedIconRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [form, setForm] = useState<CourseBasicsFormValues>(EMPTY_FORM);
  /** True when editing a published course — saves go to the hidden draft course, not the live one. */
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  /** Pending edit is locked (submitted for moderation) — show read-only. */
  const [isLocked, setIsLocked] = useState(false);
  /** The slug every save targets: the live course's slug for a normal draft,
   *  or the hidden PENDING_EDIT shadow course's slug when editing a published course. */
  const [contentSlug, setContentSlug] = useState<string | null>(null);
  const [moderationReview, setModerationReview] = useState<import("@/entities/course").ModerationReview | null>(null);
  /** Fields approved by moderator — read-only when pending edit is in needs_revision state. */
  const [readonlyFields, setReadonlyFields] = useState<Set<string> | undefined>(undefined);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    if (!slug) return;

    getCourseBySlug(slug)
      .then(async (course) => {
        const isPublished = PUBLISHED_STATUSES.has(course.status);
        setIsPendingEditMode(isPublished);

        if (isPublished) {
          const pendingEdit = await getPendingEdit(slug);
          setIsLocked(pendingEdit.status === "pending");
          const draft = await getCourseBySlug(pendingEdit.draft_course_slug);
          setContentSlug(pendingEdit.draft_course_slug);
          setForm({
            title: draft.title,
            short_description: draft.short_description,
            full_description: draft.full_description,
            category_id: draft.category ? String(draft.category.id) : "",
            level: draft.level,
          });
          if (course.moderation_review) {
            setModerationReview(course.moderation_review);
            if (pendingEdit.status === "needs_revision") {
              setReadonlyFields(buildReadonlyFields(course.moderation_review.basics_field_statuses));
            }
          }
          if (draft.image) {
            const matched = await matchIconToImage(draft.image);
            if (matched) {
              setSelectedIcon(matched);
              loadedIconRef.current = matched;
            }
          }
        } else {
          setContentSlug(slug);
          setForm({
            title: course.title,
            short_description: course.short_description,
            full_description: course.full_description,
            category_id: course.category ? String(course.category.id) : "",
            level: course.level,
          });
          if (course.image) {
            const matched = await matchIconToImage(course.image);
            if (matched) {
              setSelectedIcon(matched);
              loadedIconRef.current = matched;
            }
          }
          if (course.moderation_review) {
            setModerationReview(course.moderation_review);
            if (course.status === "needs_revision") {
              setReadonlyFields(buildReadonlyFields(course.moderation_review.basics_field_statuses));
            }
          }
        }
      })
      .catch(() => router.push("/teacher-dashboard/courses"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function doIconUpload() {
    const icon = COURSE_ICONS.find((i) => i.name === selectedIcon);
    if (icon && contentSlug && selectedIcon !== loadedIconRef.current) await uploadCourseIcon(contentSlug, icon.src, icon.name);
  }

  function buildPayload(fallback = false): Record<string, unknown> {
    const title            = form.title            || (fallback ? "Untitled Course" : form.title);
    const short_description = form.short_description || (fallback ? "-" : form.short_description);
    const full_description  = form.full_description  || (fallback ? "-" : form.full_description);
    const level            = form.level            || (fallback ? "beginner" : form.level);

    const payload: Record<string, unknown> = { title, short_description, full_description, level };
    if (form.category_id) payload.category_id = parseInt(form.category_id, 10);
    return payload;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!contentSlug) return;
    setFieldErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      await updateCourse(contentSlug, buildPayload());
      await doIconUpload();
      router.push(`/teacher-dashboard/courses/${slug}/content`);
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.fields && Object.keys(apiErr.fields).length > 0) {
        setFieldErrors(mapApiFieldErrors(apiErr.fields));
      } else {
        setGeneralError(apiErr.message ?? "Failed to update course.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (!contentSlug) return;
    setGeneralError("");
    setSaving(true);
    try {
      await updateCourse(contentSlug, buildPayload(true));
      await doIconUpload();
      router.push("/teacher-dashboard/courses");
    } catch (err) {
      setGeneralError((err as Partial<ApiError>).message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <CourseCreationLayout>
        <p
          style={{
            fontFamily: "var(--font-base)",
            fontSize: "clamp(14px, 0.83vw, 16px)",
            color: "var(--color-text-secondary)",
            textAlign: "center",
            padding: "clamp(40px, 6vw, 80px) 0",
          }}
        >
          Loading…
        </p>
      </CourseCreationLayout>
    );
  }

  return (
    <CourseCreationLayout>
      <CoursePageHeader
        title={form.title || "Untitled Course"}
        saving={saving}
        onSaveDraft={isLocked ? () => router.push("/teacher-dashboard/courses") : handleSaveDraft}
      />
      <CourseCreationStepper currentStep={0} />
      <CourseBasicsCard onSubmit={isLocked ? (e) => { e.preventDefault(); router.push(`/teacher-dashboard/courses/${slug}/content`); } : handleSubmit}>
        <CourseBasicsForm
          form={form}
          onChange={handleChange}
          categories={categories}
          selectedIcon={selectedIcon}
          onIconSelect={isLocked ? () => {} : setSelectedIcon}
          fieldErrors={fieldErrors}
          generalError={generalError}
          submitting={submitting || isLocked}
          submitLabel={isLocked ? "View Course Content" : "Continue to Course Content"}
          onCancel={() => router.push("/teacher-dashboard/courses")}
          fieldStatuses={moderationReview?.basics_field_statuses}
          moderatorComment={moderationReview?.basics_comment || undefined}
          moderatorSectionAction={moderationReview?.basics_action || undefined}
          readonlyFields={readonlyFields}
        />
      </CourseBasicsCard>
    </CourseCreationLayout>
  );
}
