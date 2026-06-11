"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCategories, getCourseBySlug, updateCourse, uploadCourseIcon, getPendingEdit, savePendingEditMetadata, uploadPendingEditIcon } from "@/entities/course";
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

const EMPTY_FORM: CourseBasicsFormValues = { title: "", short_description: "", full_description: "", category_id: "", level: "", price: "" };

const UI_KEY_TO_FIELD: Record<string, string> = {
  "field-title":             "title",
  "field-short-description": "short_description",
  "field-full-description":  "full_description",
  "field-icon":              "icon",
  "field-category":          "category_id",
  "field-level":             "level",
  "field-price":             "price",
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
  /** Live course field values — used to detect which fields actually changed in pending edit mode. */
  const liveCourseValuesRef = useRef<Omit<CourseBasicsFormValues, "price"> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [form, setForm] = useState<CourseBasicsFormValues>(EMPTY_FORM);
  /** True when editing a published course — saves go to pending edit, not live course. */
  const [isPendingEditMode, setIsPendingEditMode] = useState(false);
  /** Pending edit is locked (submitted for moderation) — show read-only. */
  const [isLocked, setIsLocked] = useState(false);
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
          // Load or auto-create the pending edit for this published course
          const pendingEdit = await getPendingEdit(slug);
          setIsLocked(pendingEdit.status === "pending");
          liveCourseValuesRef.current = {
            title: course.title,
            short_description: course.short_description,
            full_description: course.full_description,
            category_id: course.category ? String(course.category.id) : "",
            level: course.level,
          };
          setForm({
            title: pendingEdit.title || course.title,
            short_description: pendingEdit.short_description || course.short_description,
            full_description: pendingEdit.full_description || course.full_description,
            category_id: pendingEdit.category_id
              ? String(pendingEdit.category_id)
              : course.category ? String(course.category.id) : "",
            level: pendingEdit.level || course.level,
            price: "",
          });
          if (course.moderation_review) {
            setModerationReview(course.moderation_review);
            if (pendingEdit.status === "needs_revision") {
              setReadonlyFields(buildReadonlyFields(course.moderation_review.basics_field_statuses));
            }
          }
          // pending edit image if teacher already changed it, else fall back to live course image
          const imageToMatch = pendingEdit.image || course.image || null;
          if (imageToMatch) {
            const matched = await matchIconToImage(imageToMatch);
            if (matched) {
              setSelectedIcon(matched);
              loadedIconRef.current = matched;
            }
          }
        } else {
          setForm({
            title: course.title,
            short_description: course.short_description,
            full_description: course.full_description,
            category_id: course.category ? String(course.category.id) : "",
            level: course.level,
            price: "",
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function doIconUpload() {
    const icon = COURSE_ICONS.find((i) => i.name === selectedIcon);
    if (icon && slug) await uploadCourseIcon(slug, icon.src, icon.name);
  }

  function buildPayload(fallback = false): Record<string, unknown> {
    const orig = isPendingEditMode ? liveCourseValuesRef.current : null;

    // In pending edit mode, send the live course value for unchanged fields so the
    // backend's auto-created pending edit (which may have empty strings) gets corrected
    // and the backend won't report those fields as changed.
    const title            = form.title            || orig?.title            || (fallback ? "Untitled Course" : form.title);
    const short_description = form.short_description || orig?.short_description || (fallback ? "-" : form.short_description);
    const full_description  = form.full_description  || orig?.full_description  || (fallback ? "-" : form.full_description);
    const level            = form.level            || orig?.level            || (fallback ? "beginner" : form.level);

    const payload: Record<string, unknown> = { title, short_description, full_description, level };
    if (form.category_id) payload.category_id = parseInt(form.category_id, 10);
    return payload;
  }

  async function doPendingIconUpload() {
    if (selectedIcon && selectedIcon !== loadedIconRef.current) {
      const icon = COURSE_ICONS.find((i) => i.name === selectedIcon);
      if (icon && slug) await uploadPendingEditIcon(slug, icon.src, icon.name);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug) return;
    setFieldErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      if (isPendingEditMode) {
        await savePendingEditMetadata(slug, buildPayload() as Parameters<typeof savePendingEditMetadata>[1]);
        await doPendingIconUpload();
      } else {
        const priceNum = parseFloat(form.price);
        await updateCourse(slug, {
          ...buildPayload(),
          pricing_type: !isNaN(priceNum) && priceNum > 0 ? "full_payment" : "free",
          price: form.price || "0",
        });
        await doIconUpload();
      }
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
    if (!slug) return;
    setGeneralError("");
    setSaving(true);
    try {
      if (isPendingEditMode) {
        await savePendingEditMetadata(slug, buildPayload(true) as Parameters<typeof savePendingEditMetadata>[1]);
        await doPendingIconUpload();
      } else {
        await updateCourse(slug, buildPayload(true));
        await doIconUpload();
      }
      router.push("/teacher-dashboard/courses");
    } catch (err) {
      setGeneralError((err as Partial<ApiError>).message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

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
