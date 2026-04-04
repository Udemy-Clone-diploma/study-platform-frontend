import { FormErrors, RegisterFormData } from "./types";

export function validateRegisterForm(values: RegisterFormData): FormErrors {
    const errors: FormErrors = {};

    if (!values.username.trim()) {
        errors.username = "Введіть ім’я";
    } else if (values.username.trim().length < 3) {
        errors.username = "Ім’я має містити щонайменше 3 символи";
    }

    if (!values.email.trim()) {
        errors.email = "Введіть email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = "Введіть коректний email";
    }

    if (!values.password) {
        errors.password = "Введіть пароль";
    } else if (values.password.length < 8) {
        errors.password = "Пароль має містити щонайменше 8 символів";
    } else if (!/(?=.*[a-z])/.test(values.password)) {
        errors.password = "Пароль має містити хоча б одну малу літеру";
    } else if (!/(?=.*[A-Z])/.test(values.password)) {
        errors.password = "Пароль має містити хоча б одну велику літеру";
    } else if (!/(?=.*\d)/.test(values.password)) {
        errors.password = "Пароль має містити хоча б одну цифру";
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = "Підтвердіть пароль";
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = "Паролі не співпадають";
    }

    return errors;
}