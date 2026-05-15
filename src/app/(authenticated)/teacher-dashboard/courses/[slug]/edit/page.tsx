"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCategories, getCourseBySlug, updateCourse, uploadCourseIcon } from "@/entities/course";
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

const EMPTY_FORM: CourseBasicsFormValues = { title: "", description: "", category_id: "", level: "", price: "" };

export default function EditCourseBasicsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [form, setForm] = useState<CourseBasicsFormValues>(EMPTY_FORM);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    if (!slug) return;
    getCourseBySlug(slug)
      .then(async (course) => {
        setForm({
          title: course.title,
          description: course.short_description,
          category_id: course.category ? String(course.category.id) : "",
          level: course.level,
          price: course.price === "0.00" || course.price === "0" ? "" : course.price,
        });
        if (course.image) {
          const matched = await matchIconToImage(course.image);
          if (matched) setSelectedIcon(matched);
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
    const priceNum = parseFloat(form.price);
    const payload: Record<string, unknown> = {
      title: fallback ? form.title || "Untitled Course" : form.title,
      short_description: fallback ? form.description || "-" : form.description,
      full_description: fallback ? form.description || "-" : form.description,
      level: fallback ? form.level || "beginner" : form.level,
      pricing_type: !isNaN(priceNum) && priceNum > 0 ? "full_payment" : "free",
      price: form.price || "0",
    };
    if (form.category_id) payload.category_id = parseInt(form.category_id, 10);
    return payload;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug) return;
    setFieldErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      await updateCourse(slug, buildPayload());
      await doIconUpload();
      router.push(`/teacher-dashboard/courses/${slug}/content`);
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.fields && Object.keys(apiErr.fields).length > 0) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(apiErr.fields))
          mapped[k] = Array.isArray(v) ? v.join(" ") : String(v);
        setFieldErrors(mapped);
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
      await updateCourse(slug, buildPayload(true));
      await doIconUpload();
      router.push("/teacher-dashboard/courses");
    } catch (err) {
      setGeneralError((err as Partial<ApiError>).message ?? "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <CourseCreationLayout>
      <CoursePageHeader title={form.title || "Untitled Course"} saving={saving} onSaveDraft={handleSaveDraft} />
      <CourseCreationStepper currentStep={0} />
      <CourseBasicsCard onSubmit={handleSubmit}>
        <CourseBasicsForm
          form={form}
          onChange={handleChange}
          categories={categories}
          selectedIcon={selectedIcon}
          onIconSelect={setSelectedIcon}
          fieldErrors={fieldErrors}
          generalError={generalError}
          submitting={submitting}
          submitLabel="Continue to Course Content"
          onCancel={() => router.push("/teacher-dashboard/courses")}
        />
      </CourseBasicsCard>
    </CourseCreationLayout>
  );
}
