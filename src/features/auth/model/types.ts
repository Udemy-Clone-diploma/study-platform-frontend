export type UserRole = "student" | "teacher" | "moderator";

export interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    language: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    language: string;
}

export interface RegisterResponse {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    status: string;
    avatar: string | null;
    language: string;
    is_blocked: boolean;
    date_joined: string;
    profile: unknown;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export type FormErrors = Partial<Record<keyof RegisterFormData, string>>;