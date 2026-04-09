import { getAccessToken, clearTokens, saveTokens, getRefreshToken } from "./tokenStorage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/";

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    _retry?: boolean;
};

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const accessToken = getAccessToken();

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await safeParseJson(response);

    if (!response.ok) {
        throw normalizeApiError(data, "Request failed");
    }

    return data as T;
}

async function safeParseJson(response: Response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function normalizeApiError(data: unknown, fallbackMessage: string) {
    if (!data) {
        return {
            message: fallbackMessage,
            fields: {} as Record<string, string | string[]>,
        };
    }

    if (typeof data === "string") {
        return {
            message: data,
            fields: {} as Record<string, string | string[]>,
        };
    }

    if (typeof data === "object") {
        const typedData = data as Record<string, unknown>;

        return {
            message:
                typeof typedData.message === "string"
                    ? typedData.message
                    : typeof typedData.detail === "string"
                      ? typedData.detail
                      : fallbackMessage,
            fields:
                typedData.errors && typeof typedData.errors === "object"
                    ? (typedData.errors as Record<string, string | string[]>)
                    : typedData,
        };
    }

    return {
        message: fallbackMessage,
        fields: {} as Record<string, string | string[]>,
    };
}