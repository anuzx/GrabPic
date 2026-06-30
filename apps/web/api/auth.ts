import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
});

export async function getMe() {
  try {
    const { data } = await api.get("/api/user/me");
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await api.post("/api/user/logout");
  } catch {
    // ignore
  }
}
