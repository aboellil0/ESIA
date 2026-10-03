import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailApi, getApiErrorMessage } from "../lib/authApi";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }
    verifyEmailApi(token)
      .then((data) => {
        setStatus("success");
        setMessage(data?.message || "Email verified successfully. You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(getApiErrorMessage(err, "Invalid or expired verification link."));
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] px-6 text-[#382530]">
      <div className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 text-center shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4f63]">ESIA</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {status === "loading" ? "Confirming..." : status === "success" ? "Email confirmed" : "Link problem"}
        </h1>
        <p className={`mt-3 text-sm ${status === "error" ? "text-[#b03a3a]" : "text-[#6b5460]"}`}>{message}</p>
        {status !== "loading" ? (
          <Link
            to="/auth"
            className="mt-6 block w-full rounded-xl bg-[#382530] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#271d25]"
          >
            Go to login
          </Link>
        ) : null}
      </div>
    </main>
  );
}
