import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorCode, getApiErrorMessage } from "./api";
import { authService } from "../services/auth";

export type AppUser = {
  $id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  isVerified?: boolean;
  createdAt?: string;
};

const USER_STORAGE_KEY = "esia-user";
const ACCESS_TOKEN_KEY = "esia-access-token";
const REFRESH_TOKEN_KEY = "esia-refresh-token";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizeRole = (value?: string | null): AppUser["role"] => {
  if (value === "admin") return "admin";
  return "user";
};

const normalizeBackendUser = (payload: any): AppUser | null => {
  if (!payload || typeof payload !== "object") return null;

  const user = payload.user ?? payload;
  const email = String(user?.email ?? "").trim();
  if (!email) return null;

  return {
    $id: String(user?.id ?? payload.id ?? `backend-${Date.now()}`),
    name: String(
      user?.name ?? user?.email?.split("@")[0] ?? email.split("@")[0],
    ),
    email,
    role: normalizeRole(user?.role ?? payload.role),
    phone: (user?.phone ?? payload.phone ?? null) as string | null,
    address: (user?.address ?? payload.address ?? null) as string | null,
    city: (user?.city ?? payload.city ?? null) as string | null,
    isVerified: user?.isVerified ?? payload.isVerified,
    createdAt: user?.createdAt ?? payload.createdAt,
  };
};

const persistSession = (payload: any, user: AppUser) => {
  const accessToken = payload?.accessToken ?? payload?.data?.accessToken;
  const refreshToken = payload?.refreshToken ?? payload?.data?.refreshToken;

  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AppUser | null;
    if (!user || !user.email || !user.$id) return null;
    return user;
  } catch {
    return null;
  }
}

export function useAuthSession() {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());
  const [error, setError] = useState<{ message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)));

  const loadCurrentUser = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    try {
      const payload = await authService.me();
      const backendUser = normalizeBackendUser(payload?.user ?? payload);

      if (!backendUser) {
        clearSession();
        setUser(null);
        return;
      }

      setUser(backendUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(backendUser));
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const signIn = useMemo(
    () => ({
      emailPassword: async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        setIsLoading(true);
        setError(null);

        try {
          const normalized = normalizeEmail(email);
          const payload = await authService.login({ email: normalized, password });
          const backendUser = normalizeBackendUser(payload?.user ?? payload);

          if (!backendUser) {
            throw new Error("Login response was empty.");
          }

          persistSession(payload, backendUser);
          setUser(backendUser);
          return backendUser;
        } catch (err) {
          // Unverified accounts cannot receive tokens: send them to the
          // check-email page instead of showing a dead-end error.
          if (getApiErrorCode(err) === "EMAIL_NOT_VERIFIED") {
            return { unverified: true, email: normalizeEmail(email) } as any;
          }
          const message = getApiErrorMessage(err) || "Authentication failed.";
          setError({ message });
          return undefined;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [],
  );

  const signUp = useMemo(
    () => ({
      emailPassword: async ({
        email,
        password,
        name,
        phone,
      }: {
        email: string;
        password: string;
        name?: string;
        phone?: string;
      }) => {
        setIsLoading(true);
        setError(null);

        try {
          const registration = await authService.register({
            name: name?.trim() || email.split("@")[0],
            email: normalizeEmail(email),
            password,
            phone: phone?.trim() || undefined,
          });
          return registration;
        } catch (err) {
          const message = getApiErrorMessage(err) || "Registration failed.";
          setError({ message });
          return undefined;
        } finally {
          setIsLoading(false);
        }
      },
    }),
    [],
  );

  const signOut = useMemo(
    () => ({
      signOut: async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          try {
            await authService.logout(refreshToken);
          } catch {
            // Ignore logout errors and clear local session.
          }
        }

        clearSession();
        setUser(null);
        setError(null);
      },
    }),
    [],
  );

  const refreshProfile = useCallback(async () => {
    try {
      const payload = await authService.me();
      const backendUser = normalizeBackendUser(payload?.user ?? payload);
      if (backendUser) {
        setUser(backendUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(backendUser));
      }
      return backendUser;
    } catch {
      return null;
    }
  }, []);

  return { user, isLoading, signIn, signUp, signOut, error, refreshProfile, setUser };
}

export { clearSession };
