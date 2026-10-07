import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../lib/api";
import { authService } from "../services/auth";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!token) {
      setState("error");
      setMessage("رابط تأكيد البريد غير مكتمل.");
      return () => { active = false; };
    }

    authService.verifyEmail(token)
      .then(() => {
        if (active) {
          setState("success");
          setMessage("تم تأكيد بريدك الإلكتروني. يمكنك تسجيل الدخول الآن.");
        }
      })
      .catch((error) => {
        if (active) {
          setState("error");
          setMessage(getApiErrorMessage(error));
        }
      });
    return () => { active = false; };
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f7] px-5 text-[#382530]">
      <section className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 text-center shadow-lg">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9a4f63]">ESIA COUTURE</p>
        <h1 className="text-2xl font-semibold">تأكيد البريد الإلكتروني</h1>
        <p className="mt-4 text-sm" role={state === "error" ? "alert" : "status"}>
          {state === "loading" ? "جارٍ تأكيد البريد الإلكتروني..." : message}
        </p>
        {state !== "loading" && <Link to="/auth" className="mt-6 inline-block rounded-xl bg-[#9a4f63] px-5 py-3 font-semibold text-white">العودة لتسجيل الدخول</Link>}
      </section>
    </main>
  );
}
