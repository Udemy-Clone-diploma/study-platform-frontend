export interface LoginFormData {
    email: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface TokenRefreshResponse {
    access: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;
