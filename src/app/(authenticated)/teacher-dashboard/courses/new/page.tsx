"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCategories, createCourse, uploadCourseIcon } from "@/entities/course";
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
import { getMe } from "@/entities/user";
import type { TeacherProfile } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";

const EMPTY_FORM: CourseBasicsFormValues = { title: "", description: "", category_id: "", level: "", price: "" };

export default function NewCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [teacherProfileId, setTeacherProfileId] = useState<number | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [form, setForm] = useState<CourseBasicsFormValues>(EMPTY_FORM);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getMe()
      .then((user) => setTeacherProfileId((user.profile as TeacherProfile).id))
      .catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function doIconUpload(slug: string) {
    const icon = COURSE_ICONS.find((i) => i.name === selectedIcon);
    if (icon) await uploadCourseIcon(slug, icon.src, icon.name);
  }

  function buildPayload(fallback = false): Record<string, unknown> {
    const priceNum = parseFloat(form.price);
    const payload: Record<string, unknown> = {
      teacher_profile: teacherProfileId,
      title: fallback ? form.title || "Untitled Course" : form.title,
      short_description: fallback ? form.description || "-" : form.description,
      full_description: fallback ? form.description || "-" : form.description,
      level: fallback ? form.level || "beginner" : form.level,
      language: "english",
      mode: "self_learning",
      delivery_type: "self_paced",
      course_type: "knowledge",
      pricing_type: !isNaN(priceNum) && priceNum > 0 ? "full_payment" : "free",
      price: form.price || "0",
      duration_hours: 1,
      status: "draft",
    };
    if (form.category_id) payload.category_id = parseInt(form.category_id, 10);
    return payload;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      const course = await createCourse(buildPayload());
      await doIconUpload(course.slug);
      router.push(`/teacher-dashboard/courses/${course.slug}/content`);
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      if (apiErr.fields && Object.keys(apiErr.fields).length > 0) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(apiErr.fields))
          mapped[k] = Array.isArray(v) ? v.join(" ") : String(v);
        setFieldErrors(mapped);
      } else {
        setGeneralError(apiErr.message ?? "Failed to create course.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setGeneralError("");
    setSaving(true);
    try {
      const course = await createCourse(buildPayload(true));
      await doIconUpload(course.slug);
      router.push("/teacher-dashboard/courses");
    } catch (err) {
      setGeneralError((err as Partial<ApiError>).message ?? "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

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
          onCancel={() => router.push("/teacher-dashboard/courses")}
        />
      </CourseBasicsCard>
    </CourseCreationLayout>
  );
}
