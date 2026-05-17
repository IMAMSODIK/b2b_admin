export const ADMIN_TOKEN_KEY = "admin_jwt";
export const ADMIN_TOKEN_COOKIE = "admin_jwt";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromStorage = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (fromStorage) return fromStorage;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ADMIN_TOKEN_COOKIE}=`));
  if (!cookie) return null;
  const [, value] = cookie.split("=", 2);
  return value || null;
}

export function setAdminToken(token: string, maxAgeSec = 3600): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${token}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
