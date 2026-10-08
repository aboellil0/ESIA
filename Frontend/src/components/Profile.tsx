import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { authService } from "../services/auth";
import { ordersService } from "../services/orders";
import type { AppUser } from "../lib/authSession";

type Tab = "info" | "orders" | "security";

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  pending_payment: "بانتظار الدفع",
  accepted: "مقبول",
  rejected: "مرفوض",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const paymentStatusLabels: Record<string, string> = {
  not_submitted: "لم يُرسل",
  submitted: "قيد المراجعة",
  verified: "تم التحقق",
  rejected: "مرفوض",
};

const inputClass =
  "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9a4f63]";

export default function Profile({
  user,
  onNavigate,
  onLogout,
  onRefreshUser,
}: {
  user: AppUser;
  onNavigate: (view: string, value?: string) => void;
  onLogout: () => Promise<void>;
  onRefreshUser?: () => Promise<unknown>;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNotice, setPwNotice] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const initial = (user.name || user.email || "؟").trim().charAt(0).toUpperCase();

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const result = await ordersService.myOrders({ page: 1, limit: 20 });
      setOrders(Array.isArray(result?.orders) ? result.orders : []);
    } catch (loadError) {
      setOrders([]);
      setOrdersError(getApiErrorMessage(loadError));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "orders") void loadOrders();
  }, [tab, loadOrders]);

  const openOrder = async (id: number | string) => {
    setBusy(true);
    try {
      setSelected(await ordersService.myOrderById(id));
    } catch (loadError) {
      setOrdersError(getApiErrorMessage(loadError));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const result = await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      const updated = result?.user ?? result;
      if (updated) {
        setName(updated.name ?? name.trim());
        setPhone(updated.phone ?? phone.trim());
      }
      if (onRefreshUser) await onRefreshUser();
      setNotice("تم حفظ بياناتك بنجاح.");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    setNotice(null);
    setError(null);
    try {
      await authService.resendVerification(user.email);
      setNotice("تم إرسال رابط التأكيد إلى بريدك. تحققي من صندوق الوارد.");
    } catch (resendError) {
      setError(getApiErrorMessage(resendError));
    } finally {
      setResending(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPwNotice(null);
    setPwError(null);
    if (newPassword !== confirmPassword) {
      setPwError("تأكيد كلمة المرور غير متطابق.");
      return;
    }
    setPwBusy(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwNotice("تم تغيير كلمة المرور بنجاح.");
    } catch (pwErr) {
      setPwError(getApiErrorMessage(pwErr));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1000px] px-5 py-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.14em]" style={{ color: "var(--gold)" }}>
            ESIA ACCOUNT
          </p>
          <h1 className="mt-2 font-marcellus text-3xl">حسابي</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="rounded-xl border bg-white px-4 py-2 text-sm"
            style={{ borderColor: "var(--line)" }}
          >
            المتجر
          </button>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="rounded-xl border bg-white px-4 py-2 text-sm text-red-700"
            style={{ borderColor: "var(--line)" }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      <section
        className="flex flex-wrap items-center gap-4 rounded-3xl border bg-white p-6"
        style={{ borderColor: "var(--line)" }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ background: "var(--rose-deep)" }}
          aria-hidden="true"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold">{user.name}</h2>
          <p className="truncate text-sm text-gray-600" dir="ltr">
            {user.email}
          </p>
          <p className="mt-1 text-xs">
            {user.isVerified ? (
              <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-800">
                البريد مؤكد
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800">
                البريد غير مؤكد
              </span>
            )}
          </p>
        </div>
      </section>

      <nav className="mt-5 flex gap-2">
        <TabButton active={tab === "info"} onClick={() => setTab("info")}>
          بياناتي
        </TabButton>
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
          طلباتي
        </TabButton>
        <TabButton active={tab === "security"} onClick={() => setTab("security")}>
          الأمان
        </TabButton>
      </nav>

      {tab === "info" && (
        <section
          className="mt-4 rounded-3xl border bg-white p-6"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-lg font-bold">البيانات الأساسية</h2>
          {notice && (
            <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              الاسم الكامل
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </label>
            <label className="text-sm">
              رقم الهاتف
              <input
                value={phone ?? ""}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                dir="ltr"
                className={inputClass}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              البريد الإلكتروني
              <input value={user.email} readOnly disabled dir="ltr" className={inputClass + " opacity-60"} />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50"
                style={{ background: "var(--rose-deep)" }}
              >
                {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </form>

          {!user.isVerified && (
            <div className="mt-5 rounded-2xl bg-[#fbf5ef] p-4 text-sm">
              <p className="font-semibold">بريدك غير مؤكد بعد.</p>
              <p className="mt-1 text-gray-600">أكّدي بريدك لتتمكني من الطلب وتتبع الشحنات.</p>
              <button
                type="button"
                onClick={() => void resendVerification()}
                disabled={resending}
                className="mt-3 rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {resending ? "جارٍ الإرسال..." : "إعادة إرسال رابط التأكيد"}
              </button>
            </div>
          )}
        </section>
      )}

      {tab === "orders" && (
        <section className="mt-4">
          {ordersError && (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {ordersError}
              <button type="button" onClick={() => void loadOrders()} className="ms-3 underline">
                إعادة المحاولة
              </button>
            </p>
          )}
          {ordersLoading ? (
            <p role="status" className="py-16 text-center">
              جارٍ تحميل الطلبات...
            </p>
          ) : orders.length === 0 && !ordersError ? (
            <div
              className="rounded-2xl border bg-white p-10 text-center"
              style={{ borderColor: "var(--line)" }}
            >
              <p>لا توجد طلبات مرتبطة بهذا الحساب.</p>
              <button type="button" onClick={() => onNavigate("home")} className="mt-4 underline">
                تصفحي المنتجات
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <button
                  type="button"
                  key={order.id}
                  onClick={() => void openOrder(order.id)}
                  disabled={busy}
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 text-right"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span>
                    <strong className="block" dir="ltr">
                      {order.orderNumber}
                    </strong>
                    <span className="text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : ""}
                    </span>
                  </span>
                  <span className="text-sm">
                    {statusLabels[order.status] ?? order.status} ·{" "}
                    {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                  <strong>{Number(order.totalAmount).toLocaleString()} ج.م</strong>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "security" && (
        <section
          className="mt-4 rounded-3xl border bg-white p-6"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-lg font-bold">تغيير كلمة المرور</h2>
          <p className="mt-1 text-sm text-gray-600">أدخلي كلمتك الحالية ثم اختاري كلمة جديدة.</p>
          {pwNotice && (
            <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
              {pwNotice}
            </p>
          )}
          {pwError && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {pwError}
            </p>
          )}
          <form onSubmit={changePassword} className="mt-4 grid gap-3">
            <label className="text-sm">
              كلمة المرور الحالية
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              كلمة المرور الجديدة
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              تأكيد كلمة المرور الجديدة
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </label>
            <p className="text-xs leading-5 text-gray-500">
              8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز خاص، دون مسافات.
            </p>
            <div>
              <button
                type="submit"
                disabled={pwBusy}
                className="rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50"
                style={{ background: "var(--rose-deep)" }}
              >
                {pwBusy ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
              </button>
            </div>
          </form>
        </section>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
          <section className="mx-auto my-10 max-w-2xl rounded-3xl bg-white p-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold" dir="ltr">
                {selected.orderNumber}
              </h2>
              <button type="button" onClick={() => setSelected(null)}>
                إغلاق
              </button>
            </div>
            <p className="mt-3 text-sm">
              الحالة: {statusLabels[selected.status] ?? selected.status} · الدفع:{" "}
              {paymentStatusLabels[selected.paymentStatus] ?? selected.paymentStatus}
            </p>
            <div className="mt-5 space-y-2">
              {selected.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between rounded-xl bg-[#fbf5ef] p-3 text-sm">
                  <span>
                    {item.productName} × {item.quantity} · {item.size ?? "—"}
                  </span>
                  <span>{Number(item.unitPrice).toLocaleString()} ج.م</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-left font-bold">
              الإجمالي: {Number(selected.totalAmount).toLocaleString()} ج.م
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-4 py-2 text-sm font-semibold"
      style={
        active
          ? { background: "var(--rose-deep)", color: "#fff", borderColor: "var(--rose-deep)" }
          : { background: "#fff", color: "var(--plum-soft)", borderColor: "var(--line)" }
      }
    >
      {children}
    </button>
  );
}
