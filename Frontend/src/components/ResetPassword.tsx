import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../lib/api";
import { authService } from "../services/auth";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,}$/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage("");
    if (!token) {
      setError("رابط إعادة تعيين كلمة المرور غير مكتمل.");
      return;
    }
    if (!strongPassword.test(password)) {
      setError("استخدمي 8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز خاص، دون مسافات.");
      return;
    }
    if (password !== confirmation) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.resetPassword({ token, password });
      setMessage(result?.message ?? "تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.");
      setComplete(true);
    } catch (resetError) {
      setError(getApiErrorMessage(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f7] px-5 py-10 text-[#382530]">
      <section className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-7 shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#9a4f63]">ESIA COUTURE</p>
        <h1 className="mb-5 text-2xl font-semibold">إعادة تعيين كلمة المرور</h1>
        {complete ? <>
          <p role="status" className="text-sm">{message}</p>
          <Link to="/auth" className="mt-6 block rounded-xl bg-[#9a4f63] px-4 py-3 text-center font-semibold text-white">تسجيل الدخول</Link>
        </> : <form onSubmit={submit} className="space-y-3">
          {!token && <p role="alert" className="rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">{error ?? "رابط إعادة تعيين كلمة المرور غير مكتمل."}</p>}
          <input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور الجديدة" className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 text-sm outline-none focus:border-[#9a4f63]" dir="ltr" />
          <input required type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="تأكيد كلمة المرور" className="w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 text-sm outline-none focus:border-[#9a4f63]" dir="ltr" />
          <p className="text-xs leading-5 text-gray-500">يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص، وألا تقل عن 8 أحرف.</p>
          {error && token && <p role="alert" className="rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">{error}</p>}
          <button type="submit" disabled={submitting || !token} className="w-full rounded-xl bg-[#9a4f63] px-4 py-3 font-semibold text-white disabled:opacity-50">{submitting ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</button>
        </form>}
      </section>
    </main>
  );
}
