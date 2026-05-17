import { getAdminToken } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://iklanin.id";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
  } catch (err) {
    throw new Error(`Cannot reach API at ${API_BASE}. Check backend is running and CORS/API base are correct. Original error: ${String(err)}`);
  }
  if (!res.ok) {
    const raw = await res.text();
    let detail = "";
    try {
      const parsed = JSON.parse(raw) as { detail?: string };
      detail = parsed.detail || "";
    } catch {
      detail = "";
    }
    throw new Error(detail || raw || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
