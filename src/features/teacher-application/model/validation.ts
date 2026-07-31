import type {
  TeacherApplicationFormData,
  TeacherApplicationFormErrors,
} from "@/features/teacher-application/model/types";

/** Translator scoped to the "Auth.validation" namespace (shared fields) or "TeacherApplication.validation" (form-specific fields). */
type ValidationTranslator = (key: string) => string;

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validateApplicationBasicStep(
  values: TeacherApplicationFormData,
  tAuth: ValidationTranslator,
  t: ValidationTranslator,
): TeacherApplicationFormErrors {
  const errors: TeacherApplicationFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = tAuth("enterFirstName");
  }

  if (!values.lastName.trim()) {
    errors.lastName = tAuth("enterLastName");
  }

  if (!values.email.trim()) {
    errors.email = tAuth("enterEmail");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = tAuth("enterValidEmail");
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = tAuth("enterDateOfBirth");
  } else {
    const birthDate = new Date(`${values.dateOfBirth}T00:00:00`);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      errors.dateOfBirth = tAuth("enterValidDateOfBirth");
    }
  }

  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = t("enterPhoneNumber");
  }

  return errors;
}

export function validateApplicationProfileStep(
  values: TeacherApplicationFormData,
  t: ValidationTranslator,
): TeacherApplicationFormErrors {
  const errors: TeacherApplicationFormErrors = {};

  if (!values.specialization.trim()) {
    errors.specialization = t("enterFieldOfStudy");
  }

  if (!values.experience.trim()) {
    errors.experience = t("describeExperience");
  }

  if (!values.bio.trim()) {
    errors.bio = t("writeShortBio");
  }

  if (values.yearsExperience.trim()) {
    const years = Number(values.yearsExperience);
    if (!Number.isInteger(years) || years < 0) {
      errors.yearsExperience = t("enterValidYears");
    }
  }

  return errors;
}

export function validateApplicationAdditionalStep(
  values: TeacherApplicationFormData,
  t: ValidationTranslator,
): TeacherApplicationFormErrors {
  const errors: TeacherApplicationFormErrors = {};

  if (!values.motivation.trim()) {
    errors.motivation = t("tellUsWhyTeach");
  }

  if (!isValidUrl(values.instagram)) errors.instagram = t("enterValidUrl");
  if (!isValidUrl(values.linkedin)) errors.linkedin = t("enterValidUrl");
  if (!isValidUrl(values.behance)) errors.behance = t("enterValidUrl");

  return errors;
}

export function validateTeacherApplicationForm(
  values: TeacherApplicationFormData,
  tAuth: ValidationTranslator,
  t: ValidationTranslator,
): TeacherApplicationFormErrors {
  return {
    ...validateApplicationBasicStep(values, tAuth, t),
    ...validateApplicationProfileStep(values, t),
    ...validateApplicationAdditionalStep(values, t),
  };
}
