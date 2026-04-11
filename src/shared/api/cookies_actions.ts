"use server";
import { cookies } from "next/headers";

// Token config constants
const TOKEN_CONFIG = {
    access: {
        name: "access_token",
        maxAge: 60 * 15, // 15 min
    },
    refresh: {
        name: "refresh_token",
        maxAge: 60 * 60 * 24 * 7, // 7 days 
    },
} as const;

const COOKIE_DEFAULTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTP allowed in dev
    sameSite: "lax" as const,
    path: "/",
};

export async function saveTokensCookies(access_token: string, refresh_token: string): Promise<void> {
    if (!access_token || !refresh_token) {
        throw new Error("Both access and refresh tokens are required");
    }

    const cookieStorage = await cookies();

    cookieStorage.set(TOKEN_CONFIG.access.name, access_token, {
        ...COOKIE_DEFAULTS,
        maxAge: TOKEN_CONFIG.access.maxAge,
    });

    cookieStorage.set(TOKEN_CONFIG.refresh.name, refresh_token, {
        ...COOKIE_DEFAULTS,
        maxAge: TOKEN_CONFIG.refresh.maxAge,
    });
}

export async function clearTokensCookies(): Promise<void> {
    // Для удаления куки при логауте
    const cookieStorage = await cookies();
    const { access, refresh } = TOKEN_CONFIG;

    cookieStorage.delete(access.name);
    cookieStorage.delete(refresh.name);
}

export async function getAccessToken(): Promise<string | undefined> {
    const cookieStorage = await cookies();
    return cookieStorage.get(TOKEN_CONFIG.access.name)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
    const cookieStorage = await cookies();
    return cookieStorage.get(TOKEN_CONFIG.refresh.name)?.value;
}