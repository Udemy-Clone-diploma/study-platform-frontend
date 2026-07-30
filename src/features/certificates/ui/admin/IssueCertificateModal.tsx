"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { issueCertificate } from "@/entities/certificate";
import type { Certificate } from "@/entities/certificate";
import { getCourses } from "@/entities/course";
import { getUsers } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";
import { SearchSelect, type SearchSelectOption } from "./SearchSelect";

const MIN_REASON_LENGTH = 5;
const PICKER_PAGE_SIZE = 20;

type Props = {
  onClose: () => void;
  onIssued: (certificate: Certificate) => void;
};

export function IssueCertificateModal({ onClose, onIssued }: Props) {
  const t = useTranslations("IssueCertificateModal");
  const [student, setStudent] = useState<SearchSelectOption | null>(null);
  const [course, setCourse] = useState<SearchSelectOption | null>(null);
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(async (query: string): Promise<SearchSelectOption[]> => {
    const data = await getUsers({
      role: "student",
      search: query || undefined,
      pageSize: PICKER_PAGE_SIZE,
    });
    return data.results.map((user) => ({
      id: user.id,
      label: `${user.first_name} ${user.last_name}`.trim() || user.email,
      hint: user.email,
    }));
  }, []);

  const loadCourses = useCallback(async (query: string): Promise<SearchSelectOption[]> => {
    const data = await getCourses({
      search: query || undefined,
      page_size: PICKER_PAGE_SIZE,
    });
    return data.results.map((item) => ({
      id: item.id,
      label: item.title,
      hint: item.with_certificate
        ? item.teacher_name
        : `${item.teacher_name} · ${t("courseNoCertificateHint")}`,
    }));
  }, [t]);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!student) errors.student = t("studentValidationError");
    if (!course) errors.course = t("courseValidationError");
    if (reason.trim().length < MIN_REASON_LENGTH)
      errors.reason = t("reasonValidationError", { min: MIN_REASON_LENGTH });
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setFormError(null);
    try {
      const issued = await issueCertificate({
        student: student!.id,
        course: course!.id,
        reason: reason.trim(),
      });
      onIssued(issued);
    } catch (err) {
      const apiError = err as ApiError;
      setFieldErrors(mapApiFieldErrors(apiError.fields));
      setFormError(apiError.message ?? t("errorGeneric"));
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      closeOnOverlayClick={false}
      title={t("title")}
      width="clamp(360px, 38vw, 560px)"
      padding="clamp(20px, 2.08vw, 32px) clamp(24px, 2.5vw, 40px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit} noValidate>
        <p
          className="font-(family-name:--font-base) font-normal text-(--color-text-secondary)"
          style={{
            fontSize: "clamp(13px, 0.97vw, 16px)",
            lineHeight: 1.5,
            margin: "0 0 clamp(16px, 1.39vw, 20px)",
          }}
        >
          {t("description")}
        </p>

        <div className="flex flex-col gap-4">
          <SearchSelect
            id="issue-student"
            label={t("studentLabel")}
            placeholder={t("studentPlaceholder")}
            value={student}
            onChange={setStudent}
            loadOptions={loadStudents}
            error={fieldErrors.student}
          />
          <SearchSelect
            id="issue-course"
            label={t("courseLabel")}
            placeholder={t("coursePlaceholder")}
            value={course}
            onChange={setCourse}
            loadOptions={loadCourses}
            error={fieldErrors.course}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="issue-reason" className="font-mono text-sm font-medium text-gray-400">
              {t("reasonLabel")}
            </label>
            <textarea
              id="issue-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              aria-invalid={fieldErrors.reason ? true : undefined}
              className={`w-full resize-y rounded-lg border px-3 py-2 outline-none transition ${
                fieldErrors.reason
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-black"
              }`}
            />
            {fieldErrors.reason && (
              <span className="text-sm text-red-500">{fieldErrors.reason}</span>
            )}
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          submitLabel={t("submitLabel")}
          loading={loading}
          disabled={loading}
          error={formError}
        />
      </form>
    </ModalShell>
  );
}
