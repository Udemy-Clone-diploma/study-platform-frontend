import { RegisterFormErrors, RegisterFormData } from "@/features/auth/model/types/registerTypes";
import { LoginFormErrors, LoginFormData } from "@/features/auth/model/types/loginTypes";

export function validateRegisterForm(values: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

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

  if (!values.password_confirm) {
    errors.password_confirm = "Підтвердіть пароль";
  } else if (values.password !== values.password_confirm) {
    errors.password_confirm = "Паролі не співпадають";
  }

  return errors;
}

export function validateLoginForm(values: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};
  if (!values.email.trim()) {
    errors.email = "Введіть email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Введіть коректний email";
  }

  if (!values.password) {
    errors.password = "Введіть пароль";
  }

  return errors;
}
