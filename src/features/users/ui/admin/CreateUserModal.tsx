"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { Input } from "@/shared/ui/Input";
import { DatePicker, todayISO } from "@/shared/ui/DatePicker";
import { createUser } from "@/entities/user";
import type { UserLanguage, UserRole } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";
import { LANGUAGE_OPTIONS, getRoleOptions } from "../../model/labels";
import { LabeledSelect } from "./LabeledSelect";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export function CreateUserModal({ onClose, onCreated }: Props) {
  const t = useTranslations("CreateUserModal");
  const tRoles = useTranslations("PublicProfile.roles");
  const roleOptions = getRoleOptions(tRoles);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "student" as UserRole,
    language: "en" as UserLanguage,
    date_of_birth: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.first_name.trim()) errors.first_name = t("firstNameRequired");
    if (!form.last_name.trim()) errors.last_name = t("lastNameRequired");
    if (!form.email.trim()) errors.email = t("emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t("emailInvalid");
    if (!form.password) errors.password = t("passwordRequired");
    else if (form.password.length < 8) errors.password = t("passwordTooShort");
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
      await createUser({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        language: form.language,
        ...(form.date_of_birth ? { date_of_birth: form.date_of_birth } : {}),
      });
      onCreated();
    } catch (err) {
      const apiError = err as ApiError;
      setFieldErrors(mapApiFieldErrors(apiError.fields));
      setFormError(apiError.message ?? t("failedToCreate"));
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="create-first-name"
            label={t("firstNameLabel")}
            value={form.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            error={fieldErrors.first_name}
          />
          <Input
            id="create-last-name"
            label={t("lastNameLabel")}
            value={form.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            error={fieldErrors.last_name}
          />
          <div className="sm:col-span-2">
            <Input
              id="create-email"
              label={t("emailLabel")}
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={fieldErrors.email}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              id="create-password"
              label={t("passwordLabel")}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={fieldErrors.password}
            />
          </div>
          <LabeledSelect
            label={t("roleLabel")}
            options={roleOptions}
            value={form.role}
            onChange={(value) => setField("role", value as UserRole)}
            error={fieldErrors.role}
          />
          <LabeledSelect
            label={t("languageLabel")}
            options={LANGUAGE_OPTIONS}
            value={form.language}
            onChange={(value) => setField("language", value as UserLanguage)}
            error={fieldErrors.language}
          />
          <DatePicker
            label={t("dateOfBirthLabel")}
            max={todayISO()}
            value={form.date_of_birth}
            onChange={(value) => setField("date_of_birth", value)}
            error={fieldErrors.date_of_birth}
          />
        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={t("createLabel")}
          loading={loading}
          disabled={loading}
          error={formError}
        />
      </form>
    </ModalShell>
  );
}
