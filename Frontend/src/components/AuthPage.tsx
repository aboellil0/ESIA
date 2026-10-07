import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { authService } from "../services/auth";

export type AuthPageProps = {
  user: any;
  isLoading: boolean;
  signIn: { emailPassword: (input: { email: string; password: string }) => Promise<any> };
  signUp: { emailPassword: (input: { email: string; password: string; name?: string; phone?: string }) => Promise<any> };
  signOut: { signOut: () => Promise<void> };
  error: { message: string } | null;
  onContinueAsGuest: () => void;
  onRequireVerification: (email: string) => void;
};

type FormMode = "signin" | "signup" | "forgot" | "resend";
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,}$/;
const inputClass = "w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 text-sm text-[#382530] outline-none focus:border-[#9a4f63]";

export default function AuthPage({ user, isLoading, signIn, signUp, signOut, error, onContinueAsGuest, onRequireVerification }: AuthPageProps) {
  const [mode, setMode] = useState<FormMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const changeMode = (next: FormMode) => {
    setMode(next);
    setNotice(null);
    setActionError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    setActionError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "forgot") {
        const result = await authService.requestPasswordReset(normalizedEmail);
        setNotice(result?.message ?? "إذا كان البريد مسجلًا، فستصلك تعليمات إعادة تعيين كلمة المرور.");
      } else if (mode === "resend") {
        const result = await authService.resendVerification(normalizedEmail);
        setNotice(result?.message ?? "إذا كان الحساب يحتاج إلى التأكيد، فسيصلك رابط التأكيد على البريد.");
      } else if (mode === "signup") {
        if (!strongPassword.test(password)) {
          setActionError("استخدمي 8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز خاص، دون مسافات.");
          return;
        }
        const result = await signUp.emailPassword({ email: normalizedEmail, password, name: name.trim() || undefined, phone: phone.trim() || undefined });
        if (result) {
          setPassword("");
          onRequireVerification(normalizedEmail);
        }
      } else {
        const result = await signIn.emailPassword({ email: normalizedEmail, password });
        if (result && (result as any).unverified) {
          onRequireVerification((result as any).email || normalizedEmail);
        }
      }
    } catch (submitError) {
      setActionError(getApiErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <main className="grid min-h-screen place-items-center bg-[#fff8f7]" role="status">جارٍ تحميل الحساب...</main>;
  if (user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff8f7] px-5 text-[#382530]">
        <section className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold">مرحباً، {user.name || user.email}</h1>
          <p className="mt-2 text-sm text-[#6b5460]">الدور: {user.role === "admin" ? "مدير" : "مستخدم"}</p>
          <button type="button" onClick={() => void signOut.signOut()} className="mt-6 w-full rounded-xl bg-[#9a4f63] px-4 py-3 font-semibold text-white">تسجيل الخروج</button>
        </section>
      </main>
    );
  }

  const heading = mode === "signin" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء حساب" : mode === "forgot" ? "استعادة كلمة المرور" : "تأكيد البريد الإلكتروني";
  const actionLabel = mode === "signin" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء الحساب" : mode === "forgot" ? "إرسال رابط الاستعادة" : "إعادة إرسال رابط التأكيد";

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f7] px-5 py-10 text-[#382530]">
      <section className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-7 shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#9a4f63]">ESIA COUTURE</p>
        <h1 className="mb-6 text-2xl font-semibold">{heading}</h1>
        {(mode === "signin" || mode === "signup") && <div className="mb-6 flex overflow-hidden rounded-xl border border-[#ead5db]">
          <button type="button" onClick={() => changeMode("signin")} className={"flex-1 py-2.5 text-sm font-semibold " + (mode === "signin" ? "bg-[#9a4f63] text-white" : "bg-white text-[#6b5460]")}>دخول</button>
          <button type="button" onClick={() => changeMode("signup")} className={"flex-1 py-2.5 text-sm font-semibold " + (mode === "signup" ? "bg-[#9a4f63] text-white" : "bg-white text-[#6b5460]")}>حساب جديد</button>
        </div>}
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && <>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="الاسم الكامل" autoComplete="name" className={inputClass} />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="رقم الهاتف" type="tel" autoComplete="tel" className={inputClass} />
          </>}
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="البريد الإلكتروني" autoComplete="email" className={inputClass} dir="ltr" />
          {(mode === "signin" || mode === "signup") && <input required type="password" minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور" autoComplete={mode === "signin" ? "current-password" : "new-password"} className={inputClass} dir="ltr" />}
          {mode === "signup" && <p className="text-xs leading-5 text-gray-500">يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم ورمز خاص، وألا تتضمن مسافات.</p>}
          {notice && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}
          {(actionError || ((mode === "signin" || mode === "signup") && error?.message)) && <p role="alert" className="rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">{actionError ?? error?.message}</p>}
          <button type="submit" disabled={submitting} className="mt-3 w-full rounded-xl bg-[#9a4f63] px-4 py-3 font-semibold text-white disabled:opacity-50">{submitting ? "جارٍ الإرسال..." : actionLabel}</button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-[#6b5460]">
          {mode === "signin" && <button type="button" onClick={() => changeMode("forgot")} className="underline">نسيت كلمة المرور؟</button>}
          {mode === "signin" && <button type="button" onClick={() => changeMode("resend")} className="underline">إعادة إرسال تأكيد البريد</button>}
          {(mode === "forgot" || mode === "resend") && <button type="button" onClick={() => changeMode("signin")} className="underline">العودة لتسجيل الدخول</button>}
        </div>
        <button type="button" onClick={onContinueAsGuest} className="mt-4 w-full rounded-xl border border-[#d6b0ba] bg-[#fffaf9] px-4 py-3 text-sm font-semibold text-[#6b5460]">المتابعة كضيف</button>
      </section>
    </main>
  );
}
