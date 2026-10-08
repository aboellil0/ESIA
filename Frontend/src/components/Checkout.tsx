import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { CartItem } from "../App";
import { getApiErrorMessage } from "../lib/api";
import { DEPOSIT_RATE, RECEIPT_MAX_BYTES, SHIPPING_FEE } from "../lib/storeConfig";

export interface CheckoutSavedInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

interface Props {
  items: CartItem[];
  loading: boolean;
  cartError: string | null;
  savedInfo?: CheckoutSavedInfo | null;
  onRetryCart: () => Promise<void>;
  onNavigate: (view: string, value?: string) => void;
  onRemoveItem: (itemId: number) => Promise<void>;
  onUpdateQty: (itemId: number, qty: number) => Promise<void>;
  onClearCart: () => Promise<void>;
  onPlaceOrder: (payload: {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    items: CartItem[];
    total: number;
    senderName: string;
    senderNumber: string;
    paymentAmount: number;
    proofFile: File;
    notes?: string;
  }) => Promise<string>;
}

const transferNumber = import.meta.env.VITE_TRANSFER_NUMBER?.trim() ?? "";
const transferAccountName =
  import.meta.env.VITE_TRANSFER_ACCOUNT_NAME?.trim() ?? "";
const maxReceiptBytes = RECEIPT_MAX_BYTES;
const inputClass =
  "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9a4f63]";

export default function Checkout({
  items,
  loading,
  cartError,
  savedInfo,
  onRetryCart,
  onNavigate,
  onRemoveItem,
  onUpdateQty,
  onClearCart,
  onPlaceOrder,
}: Props) {
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  // Auto-fill delivery info from the saved user profile (once per mount).
  // Only fills fields the user hasn't typed in, so edits are never overwritten.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !savedInfo) return;
    prefilled.current = true;
    if (savedInfo.name) setCustomerName((v) => v || savedInfo.name || "");
    if (savedInfo.email) setEmail((v) => v || savedInfo.email || "");
    if (savedInfo.phone) setPhone((v) => v || savedInfo.phone || "");
    if (savedInfo.address) setAddress((v) => v || savedInfo.address || "");
    if (savedInfo.city) setCity((v) => v || savedInfo.city || "");
  }, [savedInfo]);
  const [senderName, setSenderName] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  // Payment config missing (owner never set VITE_TRANSFER_NUMBER) blocks
  // ordering entirely — keep the failure visible instead of a "dead" button.
  const paymentUnavailable = !transferNumber;

  // Always bring submit errors into view: the button sits at the bottom of a
  // long page while the banner renders at the top.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  );
  const total = subtotal + (items.length ? SHIPPING_FEE : 0);
  const depositAmount = Math.round((total * DEPOSIT_RATE + Number.EPSILON) * 100) / 100;
  const remainingAmount = Math.round((total - depositAmount + Number.EPSILON) * 100) / 100;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!items.length) {
      setError("السلة فارغة.");
      return;
    }
    if (!transferNumber) {
      setError("لا يمكن تأكيد الطلب: لم يقم المتجر بإعداد رقم التحويل (Vodafone Cash) بعد.");
      return;
    }
    if (!receiptFile) {
      setError("أرفق صورة إيصال التحويل.");
      return;
    }
    if (!receiptFile.type.startsWith("image/") || receiptFile.size > maxReceiptBytes) {
      setError("يجب إرفاق صورة لا يتجاوز حجمها 3 ميجابايت.");
      return;
    }
    setSubmitting(true);
    try {
      const number = await onPlaceOrder({
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim() || undefined,
        items,
        total,
        senderName: senderName.trim(),
        senderNumber: senderNumber.trim(),
        paymentAmount: depositAmount,
        proofFile: receiptFile,
        notes: notes.trim() || undefined,
      });
      setOrderNumber(number);
      await onClearCart();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-16 text-center">
        <section
          className="rounded-3xl border bg-white p-10 shadow-sm"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="mb-4 text-5xl">✓</div>
          <h1
            className="font-marcellus text-3xl"
            style={{ color: "var(--plum)" }}
          >
            تم إرسال طلبك بنجاح
          </h1>
          <p className="mt-4 text-sm" style={{ color: "var(--plum-soft)" }}>
            رقم الطلب
          </p>
          <p
            className="mt-1 text-xl font-bold"
            dir="ltr"
            style={{ color: "var(--rose-deep)" }}
          >
            {orderNumber}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("track-order:" + orderNumber)}
              className="rounded-xl px-5 py-3 font-bold text-white"
              style={{ background: "var(--rose-deep)" }}
            >
              تتبّع الطلب
            </button>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="rounded-xl border px-5 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              العودة إلى المتجر
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1260px] px-5 py-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="text-xs font-bold tracking-[0.14em]"
            style={{ color: "var(--gold)" }}
          >
            CHECKOUT
          </p>
          <h1
            className="mt-2 font-marcellus text-3xl"
            style={{ color: "var(--plum)" }}
          >
            إتمام الطلب
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="rounded-xl border bg-white px-4 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        >
          متابعة التسوق
        </button>
      </div>
      {cartError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {cartError}
          <button type="button" disabled={loading} onClick={() => void onRetryCart()} className="ms-3 underline disabled:opacity-50">إعادة تحميل السلة</button>
        </p>
      )}
      {error && (
        <p
          ref={errorRef}
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-16 text-center">
          جارٍ تحميل السلة...
        </p>
      ) : items.length === 0 ? (
        <section
          className="rounded-3xl border bg-white p-10 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-2xl font-semibold">السلة فارغة</h2>
          <p className="mt-3 text-sm" style={{ color: "var(--plum-soft)" }}>
            أضيفي المنتجات إلى السلة للمتابعة.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="mt-6 rounded-xl px-5 py-3 font-bold text-white"
            style={{ background: "var(--rose-deep)" }}
          >
            متابعة التسوق
          </button>
        </section>
      ) : (
        <form
          onSubmit={submit}
          className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.backendItemId}
                className="flex gap-4 rounded-2xl border bg-white p-4"
                style={{ borderColor: "var(--line)" }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-28 w-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-28 w-24 rounded-xl bg-[#f5e9e8]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold">{item.name}</h2>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.color} · {item.size}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onRemoveItem(item.backendItemId)}
                      className="text-xs text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="تقليل الكمية"
                        onClick={() =>
                          void onUpdateQty(
                            item.backendItemId,
                            Math.max(1, item.qty - 1),
                          )
                        }
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        aria-label="زيادة الكمية"
                        disabled={item.qty >= 99}
                        onClick={() =>
                          void onUpdateQty(item.backendItemId, Math.min(99, item.qty + 1))
                        }
                        className="disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <strong>
                      {(item.price * item.qty).toLocaleString()} ج.م
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside
            className="space-y-4 rounded-3xl border bg-white p-6"
            style={{ borderColor: "var(--line)" }}
          >
            <h2 className="text-xl font-bold">بيانات التوصيل والدفع</h2>
            {savedInfo && (savedInfo.name || savedInfo.address) && (
              <p className="text-xs text-gray-500">
                تم ملء بياناتك المحفوظة تلقائياً — يمكنك تعديلها قبل تأكيد الطلب.
              </p>
            )}
            <div className="rounded-2xl bg-[#fbf5ef] p-4 text-sm">
              <p className="font-semibold">طريقة الدفع</p>
              <p className="mt-1" dir="ltr">
                Vodafone Cash
              </p>
              <p className="mt-3 font-semibold">رقم التحويل</p>
              {transferNumber ? (
                <p className="mt-1" dir="ltr">
                  {transferNumber}
                </p>
              ) : (
                <p className="mt-1 text-gray-600">
                  رقم التحويل غير متوفر حاليًا
                </p>
              )}
              {transferAccountName && (
                <>
                  <p className="mt-3 font-semibold">اسم الحساب</p>
                  <p className="mt-1 text-gray-600">{transferAccountName}</p>
                </>
              )}
              {paymentUnavailable && (
                <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  الدفع غير متاح حالياً: لم يقم المتجر بإعداد رقم التحويل بعد، لذلك لا يمكن تأكيد الطلبات.
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                الاسم الكامل *
                <input
                  required
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                البريد الإلكتروني *
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </label>
              <label className="text-sm">
                رقم الهاتف *
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </label>
              <label className="text-sm">
                المدينة
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                العنوان *
                <input
                  required
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                العربون المطلوب ({Math.round(DEPOSIT_RATE * 100)}% من الإجمالي)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  readOnly
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                اسم المرسل *
                <input
                  required
                  value={senderName}
                  onChange={(event) => setSenderName(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                رقم المرسل *
                <input
                  required
                  value={senderNumber}
                  onChange={(event) => setSenderNumber(event.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </label>
              <label className="text-sm">
                إيصال التحويل *
                <input
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && (!file.type.startsWith("image/") || file.size > maxReceiptBytes)) {
                      setReceiptFile(null);
                      event.currentTarget.value = "";
                      setError("يجب إرفاق صورة لا يتجاوز حجمها 3 ميجابايت.");
                      return;
                    }
                    setError(null);
                    setReceiptFile(file);
                  }}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                ملاحظات
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div
              className="space-y-2 border-t pt-4 text-sm"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>الشحن</span>
                <span>{SHIPPING_FEE.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>الإجمالي</span>
                <span style={{ color: "var(--rose-deep)" }}>
                  {total.toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span>العربون المطلوب</span>
                <span>{depositAmount.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>المتبقي بعد العربون</span>
                <span>{remainingAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || loading || Boolean(cartError) || paymentUnavailable}
              title={paymentUnavailable ? "الدفع غير متاح: رقم التحويل غير مُعد من المتجر" : undefined}
              className="w-full rounded-xl px-5 py-3 font-bold text-white disabled:opacity-50"
              style={{ background: "var(--rose-deep)" }}
            >
              {submitting ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}
            </button>
          </aside>
        </form>
      )}
    </div>
  );
}
