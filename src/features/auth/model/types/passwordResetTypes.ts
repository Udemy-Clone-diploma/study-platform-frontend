export interface PasswordResetRequestPayload {
  email: string;
}
 
export interface PasswordResetConfirmPayload {
  password: string;
}
 
export interface PasswordResetFormData {
  password: string;
  confirmPassword: string;
}
 
export type PasswordResetFormErrors = Partial<Record<keyof PasswordResetFormData, string>>;