import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const configuredBase = String(import.meta.env.VITE_API_BASE_URL ?? "/api").trim();

function normalizeApiBase(value: string) {
  const base = value.replace(/\/+$/, "") || "/api";
  if (/\/api(?:\/v1)?$/i.test(base)) return base;
  return base + "/api";
}

export const apiBaseUrl = normalizeApiBase(configuredBase);
export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
});

const ACCESS_TOKEN_KEY = "esia-access-token";
const REFRESH_TOKEN_KEY = "esia-refresh-token";
const USER_STORAGE_KEY = "esia-user";
const GUEST_TOKEN_KEY = "esia-guest-token";

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export function clearAuthState() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function withStoredTokens(config: InternalAxiosRequestConfig) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const guestToken = localStorage.getItem(GUEST_TOKEN_KEY);
  config.headers = config.headers ?? {};
  if (token) config.headers.Authorization = "Bearer " + token;
  if (guestToken) config.headers["x-guest-token"] = guestToken;
  return config;
}

api.interceptors.request.use(withStoredTokens);

export const unwrapApiResult = <T>(response: unknown): T => {
  if (!response) return response as T;
  const payload = (response as any)?.data ?? response;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
};

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("Your session has expired. Please sign in again.");

  const response = await axios.post(
    apiBaseUrl + "/auth/refresh",
    { refreshToken },
    { headers: { Accept: "application/json" } },
  );
  const payload = unwrapApiResult<any>(response) ?? {};
  const accessToken = payload.accessToken ?? payload.data?.accessToken;
  const nextRefreshToken = payload.refreshToken ?? payload.data?.refreshToken;
  if (!accessToken) throw new Error("Your session could not be renewed. Please sign in again.");

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (nextRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
  return String(accessToken);
}

function isAuthRequest(url?: string) {
  return /\/auth\/(login|register|refresh|logout)(?:\?|$)/i.test(url ?? "");
}

function redirectToLogin() {
  clearAuthState();
  if (window.location.pathname !== "/auth") {
    window.location.assign("/auth");
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    const status = error.response?.status;
    const canRefresh =
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthRequest(original.url);

    if (canRefresh) {
      original._retry = true;
      try {
        refreshRequest ??= refreshAccessToken().finally(() => {
          refreshRequest = null;
        });
        const accessToken = await refreshRequest;
        original.headers.Authorization = "Bearer " + accessToken;
        return api(original);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (status === 401 && !isAuthRequest(original?.url)) redirectToLogin();
    return Promise.reject(error);
  },
);

export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as any;
    if (typeof payload?.code === "string") return payload.code;
  }
  return null;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as any;
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.error === "string") return payload.error;
    if (Array.isArray(payload?.errors) && payload.errors.length) {
      const first = payload.errors[0];
      return typeof first === "string" ? first : String(first?.message ?? "The request is invalid.");
    }
    if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
    if (error.response?.status === 403) return "You do not have permission to do that.";
    if (error.response && error.response.status >= 500) {
      return "The server could not complete this request. Please try again.";
    }
    if (error.response && error.response.status >= 400) {
      return "Please check the information and try again.";
    }
    if (error.request) return "Could not reach the server. Check your connection and try again.";
    return error.message || "The request failed.";
  }
  return (error as any)?.message || "The request failed.";
}
