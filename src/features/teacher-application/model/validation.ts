import type {
  TeacherApplicationFormData,
  TeacherApplicationFormErrors,
} from "@/features/teacher-application/model/types";

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
): TeacherApplicationFormErrors {
  const errors: TeacherApplicationFormErrors = {};

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
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      errors.dateOfBirth = "Enter a valid date of birth";
    }
  }

  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = "Enter a phone number so a moderator can reach you";
  }

  return errors;
}

export function validateApplicationProfileStep(
  values: TeacherApplicationFormData,
): TeacherApplicationFormErrors {
  const errors: TeacherApplicationFormErrors = {};

  if (!values.specialization.trim()) {
    errors.specialization = "Enter your field of study";
  }

  if (!values.experience.trim()) {
    errors.experience = "Describe your work experience";
  }

  if (!values.bio.trim()) {
    errors.bio = "Write a short bio";
  }

  if (values.yearsExperience.trim()) {
    const years = Number(values.yearsExperience);
    if (!Number.isInteger(years) || years < 0) {
      errors.yearsExperience = "Enter a valid number of years";
    }
  }

  return errors;
}

export function validateApplicationAdditionalStep(
  values: TeacherApplicationFormData,
): TeacherApplicationFormErrors {
  const errors: TeacherApplicationFormErrors = {};

  if (!values.motivation.trim()) {
    errors.motivation = "Tell us why you want to teach on the platform";
  }

  if (!isValidUrl(values.instagram)) errors.instagram = "Enter a valid URL";
  if (!isValidUrl(values.linkedin)) errors.linkedin = "Enter a valid URL";
  if (!isValidUrl(values.behance)) errors.behance = "Enter a valid URL";

  return errors;
}

export function validateTeacherApplicationForm(
  values: TeacherApplicationFormData,
): TeacherApplicationFormErrors {
  return {
    ...validateApplicationBasicStep(values),
    ...validateApplicationProfileStep(values),
    ...validateApplicationAdditionalStep(values),
  };
}
