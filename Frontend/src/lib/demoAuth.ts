import { useCallback, useMemo, useState } from "react";

export type DemoUser = {
  $id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

const USER_STORAGE_KEY = "esia-demo-auth-user";
const ACCOUNT_STORAGE_KEY = "esia-demo-auth-accounts";

type AccountEntry = {
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readAccounts = (): AccountEntry[] => {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAccounts = (accounts: AccountEntry[]) => {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
};

export function getDemoUser(): DemoUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as DemoUser | null;
    if (!user || !user.email || !user.$id) return null;
    return user;
  } catch {
    return null;
  }
}

export function setDemoUser(user: DemoUser | null) {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function signOutDemoUser() {
  setDemoUser(null);
}

export function signUpDemoUser(input: {
  email: string;
  password: string;
  name: string;
}): { ok: boolean; message?: string; user?: DemoUser } {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const name = input.name.trim();

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Please enter a valid email." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  const existingAccounts = readAccounts();
  if (existingAccounts.some((account) => account.email === email)) {
    return { ok: false, message: "This email is already registered." };
  }

  const role: "user" | "admin" =
    email.includes("admin") || email === "admin@yourstore.com"
      ? "admin"
      : "user";

  const user: DemoUser = {
    $id: `demo-${Date.now()}`,
    email,
    name: name || email.split("@")[0],
    role,
  };

  writeAccounts([
    ...existingAccounts,
    { email, password, name: user.name, role },
  ]);

  setDemoUser(user);
  return { ok: true, user };
}

export function signInDemoUser(input: { email: string; password: string }): {
  ok: boolean;
  message?: string;
  user?: DemoUser;
} {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  const account = readAccounts().find(
    (entry) => entry.email === email && entry.password === password,
  );

  if (!account) {
    return { ok: false, message: "Incorrect email or password." };
  }

  const user: DemoUser = {
    $id: `demo-${Date.now()}`,
    email: account.email,
    name: account.name,
    role: account.role,
  };

  setDemoUser(user);
  return { ok: true, user };
}

export function useDemoAuth() {
  const [user, setUser] = useState<DemoUser | null>(() => getDemoUser());
  const [error, setError] = useState<{ message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUser = useCallback(() => {
    setUser(getDemoUser());
  }, []);

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

        const result = signInDemoUser({ email, password });
        if (!result.ok || !result.user) {
          setError({ message: result.message ?? "Authentication failed." });
          setIsLoading(false);
          return;
        }

        setUser(result.user);
        setIsLoading(false);
        return result.user;
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
      }: {
        email: string;
        password: string;
        name?: string;
      }) => {
        setIsLoading(true);
        setError(null);

        const result = signUpDemoUser({ email, password, name: name ?? "" });
        if (!result.ok || !result.user) {
          setError({ message: result.message ?? "Registration failed." });
          setIsLoading(false);
          return;
        }

        setUser(result.user);
        setIsLoading(false);
        return result.user;
      },
    }),
    [],
  );

  const signOut = useMemo(
    () => ({
      signOut: async () => {
        signOutDemoUser();
        setUser(null);
        setError(null);
      },
    }),
    [],
  );

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    error,
    refresh: refreshUser,
  } as const;
}
