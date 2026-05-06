"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { ApiError } from "@/shared/api/base";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface UseAuthFormOptions<T extends object> {
  initial: T;
  validate: (data: T) => FieldErrors<T>;
  submit: (data: T) => Promise<void>;
  fieldKeys: ReadonlyArray<keyof T>;
  fieldKeyMap?: Record<string, keyof T>;
  fallbackError?: string;
}

export function useAuthForm<T extends object>({
  initial,
  validate,
  submit,
  fieldKeys,
  fieldKeyMap,
  fallbackError = "Something went wrong. Please try again.",
}: UseAuthFormOptions<T>) {
  const [formData, setFormData] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as T);
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setApiError("");

    try {
      await submit(formData);
    } catch (error: unknown) {
      const typedError = error as Partial<ApiError>;

      if (typedError?.fields && typeof typedError.fields === "object") {
        const backendFieldErrors: FieldErrors<T> = {};

        Object.entries(typedError.fields).forEach(([key, value]) => {
          const normalizedValue = Array.isArray(value) ? value[0] : String(value);
          const mappedKey = fieldKeyMap?.[key];
          const target =
            mappedKey ?? (fieldKeys.includes(key as keyof T) ? (key as keyof T) : undefined);

          if (target !== undefined) {
            backendFieldErrors[target] = normalizedValue;
          }
        });

        setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }

      setApiError(typedError?.message || fallbackError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    formData,
    errors,
    apiError,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
    setErrors,
    setApiError,
  };
}
