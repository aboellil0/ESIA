import { useState } from "react";
import { useDemoAuth } from "../lib/demoAuth";

function DemoAuthPage() {
  const { user, isLoading, signIn, signUp, signOut, error } = useDemoAuth();
  const [email, setEmail] = useState("admin@yourstore.com");
  const [password, setPassword] = useState("123456");
  const [name, setName] = useState("Admin");

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] text-[#382530]">
        <p className="text-lg font-medium">Loading...</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] px-6 text-[#382530]">
        <div className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
          <p className="text-2xl font-semibold">
            Welcome, {user.name || user.email}
          </p>
          <p className="mt-3 text-sm text-[#6b5460]">Demo auth is active</p>
          <button
            type="button"
            onClick={() => signOut.signOut()}
            className="mt-6 w-full rounded-xl bg-[#9a4f63] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#843e51]"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] px-6 text-[#382530]">
      <div className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
        <h1 className="mb-6 text-2xl font-semibold">Demo Auth</h1>

        <div className="space-y-4">
          <input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 outline-none transition focus:border-[#9a4f63]"
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 outline-none transition focus:border-[#9a4f63]"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 outline-none transition focus:border-[#9a4f63]"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => signUp.emailPassword({ email, password, name })}
              className="rounded-xl bg-[#382530] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#271d25]"
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => signIn.emailPassword({ email, password })}
              className="rounded-xl border border-[#d6b0ba] bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#382530] transition hover:bg-[#fdebf0]"
            >
              Sign in
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">
            {error.message || "Authentication failed."}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return <DemoAuthPage />;
}
