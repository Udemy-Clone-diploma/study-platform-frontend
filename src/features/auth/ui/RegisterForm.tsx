"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../api/authApi";
import { validateRegisterForm } from "../model/validation";
import { FormErrors, RegisterFormData } from "../model/types";
import { Input } from "../../../shared/ui/Input";

const initialForm: RegisterFormData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    language: "",
};

export function RegisterForm() {
    const router = useRouter();

    const [formData, setFormData] = useState<RegisterFormData>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));

        setApiError("");
    }

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationErrors = validateRegisterForm(formData);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setApiError("");

        try {
            await registerUser({
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: "student",
                language: "en",
            });

            const loginResponse = await loginUser({
                username: formData.username.trim(),
                password: formData.password,
            });

            localStorage.setItem("accessToken", loginResponse.access);
            localStorage.setItem("refreshToken", loginResponse.refresh);

            router.push("/dashboard");
        } catch (error: unknown) {
            const typedError = error as {
                message?: string;
                fields?: Record<string, string | string[]>;
            };

            if (typedError?.fields && typeof typedError.fields === "object") {
                const backendFieldErrors: FormErrors = {};

                Object.entries(typedError.fields).forEach(([key, value]) => {
                    const normalizedValue = Array.isArray(value) ? value[0] : String(value);

                    if (key === "confirm_password") {
                        backendFieldErrors.confirmPassword = normalizedValue;
                    } else if (
                        key === "username" ||
                        key === "email" ||
                        key === "password" ||
                        key === "confirmPassword"
                    ) {
                        backendFieldErrors[key] = normalizedValue;
                    }
                });

                setErrors((prev) => ({
                    ...prev,
                    ...backendFieldErrors,
                }));
            }

            setApiError(typedError?.message || "Відбулася помилка при реєстрації. Спробуйте ще раз.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form className="register-form" onSubmit={handleSubmit}>
            <Input
                id="username"
                name="username"
                type="text"
                label="Username"
                placeholder="Введіть username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
            />

            <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="Введіть email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
            />

            <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Введіть пароль"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
            />

            <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Підтвердіть пароль"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
            />

            <Input
                id="language"
                name="language"
                type="text"
                label="Language"
                placeholder="Введіть мову"
                defaultValue={"en"}
                value={formData.language}
                onChange={handleChange}
                error={errors.language}
            />
            {apiError ? <div className="form-api-error">{apiError}</div> : null}
            
            <button
                type="submit"
                disabled={isSubmitting}
                className="align-middle mt-2 w-lg rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isSubmitting ? "Реєстрація..." : "Зареєструватися"}
            </button>
        </form>
    );
}