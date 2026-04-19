import { hc } from "hono/client";
import type { AppType } from "server/src/index";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const getAuthToken = () => localStorage.getItem("auth_token");
export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);
export const removeAuthToken = () => localStorage.removeItem("auth_token");

// Create a client that automatically includes the auth token
export const client = hc<AppType>(SERVER_URL, {
  headers: () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
});
