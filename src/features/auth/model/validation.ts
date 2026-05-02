import { RegisterFormErrors, RegisterFormData } from "@/features/auth/model/types/registerTypes";
import { LoginFormErrors, LoginFormData } from "@/features/auth/model/types/loginTypes";
import type {
  PasswordResetFormData,
  PasswordResetFormErrors,
} from "@/features/auth/model/types/passwordResetTypes";

export function validateRegisterForm(values: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  Object.assign(errors, validateRegisterIdentityStep(values));
  Object.assign(errors, validateRegisterPasswordStep(values));

  return errors;
}

export function validateRegisterIdentityStep(values: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "Enter your first name";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Enter your last name";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email";
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = "Enter your date of birth";
  } else {
    const birthDate = new Date(`${values.dateOfBirth}T00:00:00`);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      errors.dateOfBirth = "Enter a valid date of birth";
    }
  }

  return errors;
}

export function validateRegisterPasswordStep(values: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.password) {
    errors.password = "Enter your password";
  } else if (values.password.length < 8) {
    errors.password = "Password must contain at least 8 characters";
  } else if (!/(?=.*[a-z])/.test(values.password)) {
    errors.password = "Password must contain at least one lowercase letter";
  } else if (!/(?=.*[A-Z])/.test(values.password)) {
    errors.password = "Password must contain at least one uppercase letter";
  } else if (!/(?=.*\d)/.test(values.password)) {
    errors.password = "Password must contain at least one number";
  }

  if (!values.password_confirm) {
    errors.password_confirm = "Confirm your password";
  } else if (values.password !== values.password_confirm) {
    errors.password_confirm = "Passwords do not match";
  }

  return errors;
}

export function validateLoginForm(values: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter your email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email";
  }

  if (!values.password) {
    errors.password = "Enter your password";
  }

  return errors;
}

export function validatePasswordResetForm(
  values: PasswordResetFormData
): PasswordResetFormErrors {
  const errors: PasswordResetFormErrors = {};

  if (!values.password) {
    errors.password = "Enter your password";
  } else if (values.password.length < 8) {
    errors.password = "Password must contain at least 8 characters";
  } else if (!/(?=.*[a-z])/.test(values.password)) {
    errors.password = "Password must contain at least one lowercase letter";
  } else if (!/(?=.*[A-Z])/.test(values.password)) {
    errors.password = "Password must contain at least one uppercase letter";
  } else if (!/(?=.*\d)/.test(values.password)) {
    errors.password = "Password must contain at least one number";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}
