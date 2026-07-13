"use client";

import { useState } from "react";
import { ModalShell } from "@/shared/ui/ModalShell";
import { ModalFooter } from "@/shared/ui/ModalFooter";
import { Input } from "@/shared/ui/Input";
import { createUser } from "@/entities/user";
import type { UserLanguage, UserRole } from "@/entities/user";
import type { ApiError } from "@/shared/api/base";
import { mapApiFieldErrors } from "@/shared/lib/apiErrors";
import { LANGUAGE_OPTIONS, ROLE_OPTIONS } from "../../model/labels";
import { LabeledSelect } from "./LabeledSelect";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export function CreateUserModal({ onClose, onCreated }: Props) {
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
    if (!form.first_name.trim()) errors.first_name = "Enter a first name";
    if (!form.last_name.trim()) errors.last_name = "Enter a last name";
    if (!form.email.trim()) errors.email = "Enter an email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email";
    if (!form.password) errors.password = "Enter a password";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
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
      setFormError(apiError.message ?? "Failed to create the user.");
      setLoading(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      closeOnOverlayClick={false}
      title="Add user"
      width="clamp(360px, 38vw, 560px)"
      padding="clamp(20px, 2.08vw, 32px) clamp(24px, 2.5vw, 40px)"
      shadow="var(--shadow-modal)"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="create-first-name"
            label="First name"
            value={form.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            error={fieldErrors.first_name}
          />
          <Input
            id="create-last-name"
            label="Last name"
            value={form.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            error={fieldErrors.last_name}
          />
          <div className="sm:col-span-2">
            <Input
              id="create-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={fieldErrors.email}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              id="create-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={fieldErrors.password}
            />
          </div>
          <LabeledSelect
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(value) => setField("role", value as UserRole)}
            error={fieldErrors.role}
          />
          <LabeledSelect
            label="Language"
            options={LANGUAGE_OPTIONS}
            value={form.language}
            onChange={(value) => setField("language", value as UserLanguage)}
            error={fieldErrors.language}
          />
          <Input
            id="create-date-of-birth"
            label="Date of birth (optional)"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setField("date_of_birth", e.target.value)}
            error={fieldErrors.date_of_birth}
          />
        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel="Create"
          loading={loading}
          disabled={loading}
          error={formError}
        />
      </form>
    </ModalShell>
  );
}
