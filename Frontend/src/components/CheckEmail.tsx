import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../lib/api";
import { authService } from "../services/auth";

const PENDING_EMAIL_KEY = "esia-pending-email";
const RESEND_COOLDOWN_SECONDS = 60;

export function rememberPendingEmail(email: string) {
  try {
    localStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    // Storage unavailable — page still works via route state.
  }
}

export function clearPendingEmail() {
  try {
    localStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function resolveInitialEmail(search: string, state: unknown): string {
  const fromState =
    state && typeof state === "object" && "email" in state
      ? String((state as { email?: unknown }).email ?? "")
      : "";
  if (fromState.trim()) return fromState.trim();
  const param = new URLSearchParams(search).get("email");
  if (param && param.trim()) return param.trim();
  try {
    return (localStorage.getItem(PENDING_EMAIL_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export default function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => resolveInitialEmail(location.search, location.state));
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) return;
    rememberPendingEmail(email);
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("أدخلي بريدك الإلكتروني أولاً.");
      return;
    }
    setSending(true);
    setNotice(null);
    setError(null);
    try {
      const result = await authService.resendVerification(normalized);
      setNotice(result?.message ?? "تم إرسال رابط التأكيد. افتحي بريدك واضغطي على الرابط.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (resendError) {
      setError(getApiErrorMessage(resendError));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f7] px-5 py-10 text-[#382530]">
      <section className="w-full max-w-md rounded-3xl border border-[#f0d9df] bg-white p-8 text-center shadow-[0_18px_60px_-28px_rgba(56,37,48,0.35)]">
        <div className="mx-auto mb-4 text-5xl" aria-hidden="true">✉️</div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#9a4f63]">ESIA COUTURE</p>
        <h1 className="mb-3 text-2xl font-semibold">تأكيد البريد الإلكتروني</h1>
        <p className="text-sm leading-7 text-[#6b5460]">
          أرسلنا رابط التأكيد إلى
          {email ? (
            <>
              {" "}<strong dir="ltr">{email}</strong>.<br />
            </>
          ) : (
            " بريدك. "
          )}
          افتحي الرسالة واضغطي على الرابط لتفعيل حسابك. تحققي أيضاً من مجلد الرسائل غير المرغوب فيها.
        </p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="البريد الإلكتروني"
          autoComplete="email"
          dir="ltr"
          className="mt-5 w-full rounded-xl border border-[#ead5db] bg-[#fffaf9] px-4 py-3 text-center text-sm outline-none focus:border-[#9a4f63]"
        />
        {notice && <p role="status" className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#b03a3a]">{error}</p>}
        <button
          type="button"
          onClick={() => void resend()}
          disabled={sending || cooldown > 0}
          className="mt-4 w-full rounded-xl bg-[#9a4f63] px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {sending ? "جارٍ الإرسال..." : cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "إعادة إرسال رابط التأكيد"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/auth")}
          className="mt-3 w-full rounded-xl border border-[#d6b0ba] bg-[#fffaf9] px-4 py-3 text-sm font-semibold text-[#6b5460]"
        >
          العودة لتسجيل الدخول
        </button>
      </section>
    </main>
  );
}
