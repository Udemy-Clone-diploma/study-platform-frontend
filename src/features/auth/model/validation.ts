import { RegisterFormErrors, RegisterFormData } from "@/features/auth/model/types/registerTypes";
import { LoginFormErrors, LoginFormData } from "@/features/auth/model/types/loginTypes";
import type {
  PasswordResetFormData,
  PasswordResetFormErrors,
} from "@/features/auth/model/types/passwordResetTypes";

/** Translator scoped to the "Auth.validation" message namespace. */
type ValidationTranslator = (key: string) => string;

export function validateRegisterForm(
  values: RegisterFormData,
  t: ValidationTranslator,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  Object.assign(errors, validateRegisterIdentityStep(values, t));
  Object.assign(errors, validateRegisterPasswordStep(values, t));

  return errors;
}

export function validateRegisterIdentityStep(
  values: RegisterFormData,
  t: ValidationTranslator,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = t("enterFirstName");
  }

  if (!values.lastName.trim()) {
    errors.lastName = t("enterLastName");
  }

  if (!values.email.trim()) {
    errors.email = t("enterEmail");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = t("enterValidEmail");
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = t("enterDateOfBirth");
  } else {
    const birthDate = new Date(`${values.dateOfBirth}T00:00:00`);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      errors.dateOfBirth = t("enterValidDateOfBirth");
    }
  }

  return errors;
}

export function validateRegisterPasswordStep(
  values: RegisterFormData,
  t: ValidationTranslator,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.password) {
    errors.password = t("enterPassword");
  } else if (values.password.length < 8) {
    errors.password = t("passwordMinLength");
  } else if (!/(?=.*[a-z])/.test(values.password)) {
    errors.password = t("passwordLowercase");
  } else if (!/(?=.*[A-Z])/.test(values.password)) {
    errors.password = t("passwordUppercase");
  } else if (!/(?=.*\d)/.test(values.password)) {
    errors.password = t("passwordNumber");
  }

  if (!values.password_confirm) {
    errors.password_confirm = t("confirmPasswordRequired");
  } else if (values.password !== values.password_confirm) {
    errors.password_confirm = t("passwordsDoNotMatch");
  }

  return errors;
}

export function validateLoginForm(values: LoginFormData, t: ValidationTranslator): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = t("enterEmail");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = t("enterValidEmail");
  }

  if (!values.password) {
    errors.password = t("enterPassword");
  }

  return errors;
}

export function validatePasswordResetForm(
  values: PasswordResetFormData,
  t: ValidationTranslator,
): PasswordResetFormErrors {
  const errors: PasswordResetFormErrors = {};

  if (!values.password) {
    errors.password = t("enterPassword");
  } else if (values.password.length < 8) {
    errors.password = t("passwordMinLength");
  } else if (!/(?=.*[a-z])/.test(values.password)) {
    errors.password = t("passwordLowercase");
  } else if (!/(?=.*[A-Z])/.test(values.password)) {
    errors.password = t("passwordUppercase");
  } else if (!/(?=.*\d)/.test(values.password)) {
    errors.password = t("passwordNumber");
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = t("confirmPasswordRequired");
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = t("passwordsDoNotMatch");
  }

  return errors;
}
