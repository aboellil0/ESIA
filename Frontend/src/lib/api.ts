import axios from "axios";

// Vite exposes env via import.meta.env - no NextAuth needed
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API]", err?.response?.data || err.message);
    return Promise.reject(err);
  }
);
