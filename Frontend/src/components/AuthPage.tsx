import { useState } from "react";
import { useDemoAuth, signUpDemoUser, signInDemoUser } from "../lib/demoAuth";
import { registerApi, loginApi, resendVerificationApi, forgotPasswordApi, getApiErrorMessage, isEmailNotVerifiedError } from "../lib/authApi";

function DemoAuthPage() {
  const { user, isLoading, signOut, error: demoError } = useDemoAuth();
  const [email, setEmail] = useState("admin@yourstore.com");
  const [password, setPassword] = useState("123456");
  const [name, setName] = useState("Admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsVerificationFor, setNeedsVerificationFor] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

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

  const handleRegister = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    setNeedsVerificationFor(null);
    try {
      const res = await registerApi({ name, email, password });
      // Keep demo shell working: mirror the account locally (marked unverified until link clicked)
      signUpDemoUser({ email, password, name });
      setNotice(res?.message || "Registration successful. Please check your email to confirm your account.");
      setNeedsVerificationFor(email);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Registration failed."));
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    setNeedsVerificationFor(null);
    try {
      const res = await loginApi({ email, password });
      const payload = res?.data;
      if (payload?.accessToken) {
        localStorage.setItem("esia-auth-tokens", JSON.stringify({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }));
      }
      // Mirror into demo session so the storefront gating keeps working
      const fallback = signInDemoUser({ email, password });
      if (!fallback.ok) {
        signUpDemoUser({ email, password, name: payload?.user?.name || name });
      }
      window.location.reload();
    } catch (err: any) {
      if (isEmailNotVerifiedError(err)) {
        setError(err?.response?.data?.message || "Please verify your email before logging in.");
        setNeedsVerificationFor(email);
      } else {
        setError(getApiErrorMessage(err, "Authentication failed."));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    const target = needsVerificationFor || email;
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await resendVerificationApi(target);
      setNotice(res?.message || "Verification email sent. Please check your inbox.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not resend verification email."));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await forgotPasswordApi(email);
      setNotice(res?.message || "If an account exists for this email, a password reset link has been sent.");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not send reset email."));
    } finally {
      setBusy(false);
    }
  };

  const displayError = error || demoError?.message || null;

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
              disabled={busy}
              onClick={handleRegister}
              className="rounded-xl bg-[#382530] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#271d25] disabled:opacity-60"
            >
              {busy ? "..." : "Sign up"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleLogin}
              className="rounded-xl border border-[#d6b0ba] bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#382530] transition hover:bg-[#fdebf0] disabled:opacity-60"
            >
              {busy ? "..." : "Sign in"}
            </button>
          </div>

          {needsVerificationFor ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleResend}
              className="w-full rounded-xl border border-dashed border-[#9a4f63] px-4 py-3 text-sm font-semibold text-[#9a4f63] transition hover:bg-[#fff4f3] disabled:opacity-60"
            >
              Resend confirmation email
            </button>
          ) : null}

          {showForgot ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleForgot}
              className="w-full rounded-xl bg-[#9a4f63] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#843e51] disabled:opacity-60"
            >
              Send password reset email
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setShowForgot(true); setError(null); setNotice(null); }}
              className="w-full text-center text-sm font-semibold text-[#9a4f63] hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>

        {notice ? (
          <p className="mt-4 rounded-xl bg-[#eef9ef] px-3 py-2 text-sm text-[#2c6b34]">
            {notice}
          </p>
        ) : null}

        {displayError ? (
          <p className="mt-4 rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">
            {displayError}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return <DemoAuthPage />;
}
