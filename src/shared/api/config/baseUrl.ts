// Server-side uses API_URL (internal Docker address); browser uses NEXT_PUBLIC_API_URL (host-reachable).
export const API_BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1/")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1/");
