type JwtPayload = {
  exp?: number;
  role?: string;
};

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function decodeJwtPayload<T extends JwtPayload = JwtPayload>(token: string): T | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(decodeBase64Url(payload)) as T;
  } catch {
    return null;
  }
}

export function getJwtMaxAge(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): number | undefined {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return undefined;

  return Math.max(payload.exp - nowSeconds, 0);
}
