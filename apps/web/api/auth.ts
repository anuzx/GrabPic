import { getToken, removeToken } from "@/lib/auth";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMe() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

export function logout() {
  removeToken();
}
