"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { Input } from "@/shared/ui/Input";
import { updateUser } from "@/entities/user";
import type { UserData, UserLanguage, UserRole } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";
import { LANGUAGE_OPTIONS, getRoleOptions } from "../../model/labels";
import { LabeledSelect } from "./LabeledSelect";

type Props = {
  user: UserData;
  onClose: () => void;
  onSaved: (updated: UserData) => void;
};

export function EditUserModal({ user, onClose, onSaved }: Props) {
  const t = useTranslations("EditUserModal");
  const tCommon = useTranslations("Common");
  const tRoles = useTranslations("PublicProfile.roles");
  const roleOptions = getRoleOptions(tRoles);
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    language: user.language,
    instagram: user.instagram,
    linkedin: user.linkedin,
    facebook: user.facebook,
    behance: user.behance,
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
      const updated = await updateUser(user.id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        role: form.role,
        language: form.language,
        instagram: form.instagram.trim(),
        linkedin: form.linkedin.trim(),
        facebook: form.facebook.trim(),
        behance: form.behance.trim(),
      });
      onSaved(updated);
    } catch (err) {
      const apiError = err as ApiError;
      setFieldErrors(mapApiFieldErrors(apiError.fields));
      setFormError(apiError.message ?? t("failedToUpdate"));
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
            id="edit-first-name"
            label={t("firstNameLabel")}
            value={form.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            error={fieldErrors.first_name}
          />
          <Input
            id="edit-last-name"
            label={t("lastNameLabel")}
            value={form.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            error={fieldErrors.last_name}
          />
          <div className="sm:col-span-2">
            <Input
              id="edit-email"
              label={t("emailLabel")}
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={fieldErrors.email}
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
          <Input
            id="edit-instagram"
            label={t("instagramLabel")}
            type="url"
            value={form.instagram}
            onChange={(e) => setField("instagram", e.target.value)}
            error={fieldErrors.instagram}
          />
          <Input
            id="edit-linkedin"
            label={t("linkedinLabel")}
            type="url"
            value={form.linkedin}
            onChange={(e) => setField("linkedin", e.target.value)}
            error={fieldErrors.linkedin}
          />
          <Input
            id="edit-facebook"
            label={t("facebookLabel")}
            type="url"
            value={form.facebook}
            onChange={(e) => setField("facebook", e.target.value)}
            error={fieldErrors.facebook}
          />
          <Input
            id="edit-behance"
            label={t("behanceLabel")}
            type="url"
            value={form.behance}
            onChange={(e) => setField("behance", e.target.value)}
            error={fieldErrors.behance}
          />
        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={tCommon("save")}
          loading={loading}
          disabled={loading}
          error={formError}
        />
      </form>
    </ModalShell>
  );
}
