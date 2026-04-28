import { RegisterFormErrors, RegisterFormData } from "@/features/auth/model/types/registerTypes";
import { LoginFormErrors, LoginFormData } from "@/features/auth/model/types/loginTypes";
import type {
  PasswordResetFormData,
  PasswordResetFormErrors,
} from "@/features/auth/model/types/passwordResetTypes";

export function validateRegisterForm(values: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Р’РІРµРґС–С‚СЊ email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Р’РІРµРґС–С‚СЊ РєРѕСЂРµРєС‚РЅРёР№ email";
  }

  if (!values.password) {
    errors.password = "Р’РІРµРґС–С‚СЊ РїР°СЂРѕР»СЊ";
  } else if (values.password.length < 8) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С‰РѕРЅР°Р№РјРµРЅС€Рµ 8 СЃРёРјРІРѕР»С–РІ";
  } else if (!/(?=.*[a-z])/.test(values.password)) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С…РѕС‡Р° Р± РѕРґРЅСѓ РјР°Р»Сѓ Р»С–С‚РµСЂСѓ";
  } else if (!/(?=.*[A-Z])/.test(values.password)) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С…РѕС‡Р° Р± РѕРґРЅСѓ РІРµР»РёРєСѓ Р»С–С‚РµСЂСѓ";
  } else if (!/(?=.*\d)/.test(values.password)) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С…РѕС‡Р° Р± РѕРґРЅСѓ С†РёС„СЂСѓ";
  }

  if (!values.password_confirm) {
    errors.password_confirm = "РџС–РґС‚РІРµСЂРґС–С‚СЊ РїР°СЂРѕР»СЊ";
  } else if (values.password !== values.password_confirm) {
    errors.password_confirm = "РџР°СЂРѕР»С– РЅРµ СЃРїС–РІРїР°РґР°СЋС‚СЊ";
  }

  return errors;
}

export function validateLoginForm(values: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Please enter your email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Please enter your password";
  }

  return errors;
}

export function validatePasswordResetForm(
  values: PasswordResetFormData
): PasswordResetFormErrors {
  const errors: PasswordResetFormErrors = {};

  if (!values.password) {
    errors.password = "Р’РІРµРґС–С‚СЊ РїР°СЂРѕР»СЊ";
  } else if (values.password.length < 8) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С‰РѕРЅР°Р№РјРµРЅС€Рµ 8 СЃРёРјРІРѕР»С–РІ";
  } else if (!/(?=.*[a-z])/.test(values.password)) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С…РѕС‡Р° Р± РѕРґРЅСѓ РјР°Р»Сѓ Р»С–С‚РµСЂСѓ";
  } else if (!/(?=.*[A-Z])/.test(values.password)) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С…РѕС‡Р° Р± РѕРґРЅСѓ РІРµР»РёРєСѓ Р»С–С‚РµСЂСѓ";
  } else if (!/(?=.*\d)/.test(values.password)) {
    errors.password = "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С…РѕС‡Р° Р± РѕРґРЅСѓ С†РёС„СЂСѓ";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "РџС–РґС‚РІРµСЂРґС–С‚СЊ РїР°СЂРѕР»СЊ";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "РџР°СЂРѕР»С– РЅРµ СЃРїС–РІРїР°РґР°СЋС‚СЊ";
  }

  return errors;
}
