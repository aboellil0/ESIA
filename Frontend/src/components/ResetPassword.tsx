import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordApi, getApiErrorMessage } from "../lib/authApi";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setStatus("idle");
    setMessage(null);
    try {
      if (!token) throw new Error("Missing reset token. Please use the link from your email.");
      if (password !== confirm) throw new Error("Passwords do not match.");
      const data = await resetPasswordApi(token, password);
      setStatus("success");
      setMessage(data?.message || "Password has been reset successfully. You can now log in.");
    } catch (err: any) {
      setStatus("error");
      setMessage(getApiErrorMessage(err, "Could not reset password."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] px-6 text-[#382530]">
      <div className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4f63]">ESIA</p>
        <h1 className="mt-2 text-2xl font-semibold">Reset password</h1>

        {status === "success" ? (
          <>
            <p className="mt-3 rounded-xl bg-[#eef9ef] px-3 py-2 text-sm text-[#2c6b34]">{message}</p>
            <Link
              to="/auth"
              className="mt-6 block w-full rounded-xl bg-[#382530] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#271d25]"
            >
              Go to login
            </Link>
          </>
        ) : (
          <div className="mt-6 space-y-4">
            <input
              placeholder="New password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 outline-none transition focus:border-[#9a4f63]"
            />
            <input
              placeholder="Confirm new password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 outline-none transition focus:border-[#9a4f63]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleSubmit}
              className="w-full rounded-xl bg-[#382530] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#271d25] disabled:opacity-60"
            >
              {busy ? "..." : "Set new password"}
            </button>
            {status === "error" && message ? (
              <p className="rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">{message}</p>
            ) : null}
            <Link to="/auth" className="block text-center text-sm font-semibold text-[#9a4f63] hover:underline">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
