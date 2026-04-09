import { UserData, UserLanguage, UserRole, UserStatus } from "./user_data";

export interface RegisterFormData {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    language: UserLanguage;
}

export interface RegisterPayload {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: UserRole;
    language: UserLanguage;
}

export interface RegisterResponse {
    // access: string;
    // refresh: string;
    message: string;
    status: string;
}


export type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;
