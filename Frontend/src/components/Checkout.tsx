import { useMemo, useState } from "react";
import type { CartItem } from "../App";

interface Props {
  items: CartItem[];
  onNavigate: (view: string, productId?: string) => void;
  onRemoveItem: (variantKey: string) => void;
  onUpdateQty: (variantKey: string, qty: number) => void;
  onClearCart: () => void;
  onPlaceOrder: (payload: {
    customer: string;
    phone: string;
    items: CartItem[];
    total: number;
    receiptImage: string;
  }) => void;
}

const TRANSFER_NUMBER = "01000000000";

const compressImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));

        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result ?? ""));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.72);
        resolve(compressed);
      };

      img.onerror = () =>
        reject(new Error("Failed to read the uploaded image."));
      img.src = String(reader.result ?? "");
    };

    reader.onerror = () =>
      reject(new Error("Failed to read the uploaded image."));
    reader.readAsDataURL(file);
  });

export default function Checkout({
  items,
  onNavigate,
  onRemoveItem,
  onUpdateQty,
  onClearCart,
  onPlaceOrder,
}: Props) {
  const [receiptName, setReceiptName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  );
  const shipping = subtotal > 0 ? 50 : 0;
  const total = subtotal + shipping;

  const handleOrderSubmit = async () => {
    if (
      isSubmitted ||
      items.length === 0 ||
      !receiptName.trim() ||
      !receiptFile
    ) {
      return;
    }

    const receiptImage = await compressImageFile(receiptFile);

    onPlaceOrder({
      customer: receiptName.trim(),
      phone: TRANSFER_NUMBER,
      items,
      total,
      receiptImage,
    });

    setIsSubmitted(true);
    setReceiptName("");
    setReceiptFile(null);
    onClearCart();
  };

  if (isSubmitted) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-16 text-center">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-10 shadow-[var(--shadow-card)]">
          <div className="text-5xl mb-4">✅</div>
          <h1
            className="font-marcellus text-4xl mb-3"
            style={{ color: "var(--plum)" }}
          >
            تم إرسال طلبك بنجاح
          </h1>
          <p
            className="text-sm leading-7 mb-8"
            style={{ color: "var(--plum-soft)" }}
          >
            سيتم التواصل معك لتأكيد الطلب بعد مراجعة إيصال التحويل الخاص بك.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--rose), var(--rose-deep))",
            }}
          >
            العودة إلى المتجر
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitted) {
    return (
      <div className="max-w-[760px] mx-auto px-6 py-16 text-center">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-10 shadow-[var(--shadow-card)]">
          <div className="text-5xl mb-4">🛒</div>
          <h1
            className="font-marcellus text-4xl mb-3"
            style={{ color: "var(--plum)" }}
          >
            السلة فارغة
          </h1>
          <p
            className="text-sm leading-7 mb-8"
            style={{ color: "var(--plum-soft)" }}
          >
            لم يتم إضافة أي منتجات بعد. استكشفي المجموعة واختر القطع المناسبة
            لإطلالتك.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--rose), var(--rose-deep))",
            }}
          >
            متابعة التسوق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1260px] mx-auto px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p
            className="text-xs font-bold tracking-[0.14em] uppercase mb-2"
            style={{ color: "var(--gold)" }}
          >
            CHECKOUT
          </p>
          <h1
            className="font-marcellus text-4xl"
            style={{ color: "var(--plum)" }}
          >
            إتمام الطلب
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            border: "1px solid var(--line)",
            background: "#fff",
            color: "var(--rose-deep)",
          }}
        >
          متابعة التسوق
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.variantKey}
              className="flex gap-4 rounded-[24px] border border-[color:var(--line)] bg-white p-4 shadow-[var(--shadow-card)]"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-28 w-24 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ color: "var(--plum)" }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--plum-soft)" }}
                    >
                      {item.color} • {item.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.variantKey)}
                    className="text-xs font-semibold bg-transparent border-none"
                    style={{ color: "var(--red)" }}
                  >
                    حذف
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-0 overflow-hidden rounded-xl border"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQty(item.variantKey, Math.max(1, item.qty - 1))
                      }
                      className="h-10 w-10 border-none bg-transparent text-xl"
                      style={{ color: "var(--plum)" }}
                    >
                      −
                    </button>
                    <span
                      className="flex h-10 w-10 items-center justify-center text-sm font-bold"
                      style={{ color: "var(--plum)" }}
                    >
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.variantKey, item.qty + 1)}
                      className="h-10 w-10 border-none bg-transparent text-xl"
                      style={{ color: "var(--plum)" }}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-left">
                    <div
                      className="text-lg font-bold"
                      style={{ color: "var(--rose-deep)" }}
                    >
                      {(item.price * item.qty).toLocaleString()} ج.م
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-[28px] border border-[color:var(--line)] bg-white p-6 shadow-[var(--shadow-card)]">
          <h2
            className="font-marcellus text-3xl mb-5"
            style={{ color: "var(--plum)" }}
          >
            ملخص الطلب
          </h2>

          <div
            className="space-y-3 text-sm"
            style={{ color: "var(--plum-soft)" }}
          >
            <div className="flex items-center justify-between">
              <span>المجموع الفرعي</span>
              <span className="font-semibold" style={{ color: "var(--plum)" }}>
                {subtotal.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>الشحن</span>
              <span className="font-semibold" style={{ color: "var(--plum)" }}>
                {shipping.toLocaleString()} ج.م
              </span>
            </div>
            <div
              className="border-t pt-3 mt-3"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: "var(--plum)" }}>
                  الإجمالي
                </span>
                <span
                  className="text-xl font-bold"
                  style={{ color: "var(--rose-deep)" }}
                >
                  {total.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>

          <div
            className="mt-6 rounded-[20px] bg-[color:var(--ivory)] p-4"
            style={{ border: "1px solid var(--line)" }}
          >
            <p
              className="text-sm font-bold mb-2"
              style={{ color: "var(--plum)" }}
            >
              حساب التحويل
            </p>
            <p className="text-sm" style={{ color: "var(--plum-soft)" }}>
              رقم الهاتف
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: "var(--rose-deep)" }}
            >
              {TRANSFER_NUMBER}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--gray)" }}>
              اسم الحساب: ESIA Couture
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <label
              className="block text-sm font-semibold"
              style={{ color: "var(--plum)" }}
            >
              اسم المرسل
              <input
                value={receiptName}
                onChange={(event) => setReceiptName(event.target.value)}
                placeholder="اكتب اسم المرسل"
                className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                style={{
                  borderColor: "var(--line)",
                  background: "#fff",
                  color: "var(--plum)",
                }}
              />
            </label>

            <label
              className="block text-sm font-semibold"
              style={{ color: "var(--plum)" }}
            >
              صورة إيصال التحويل
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setReceiptFile(event.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full rounded-xl border px-3 py-2.5 text-sm"
                style={{
                  borderColor: "var(--line)",
                  background: "#fff",
                  color: "var(--plum)",
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleOrderSubmit}
            disabled={
              isSubmitted ||
              items.length === 0 ||
              !receiptName.trim() ||
              !receiptFile
            }
            className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{
              background:
                "linear-gradient(135deg, var(--rose), var(--rose-deep))",
            }}
          >
            {isSubmitted ? "تم تأكيد الطلب" : "تأكيد الطلب"}
          </button>

          <button
            type="button"
            onClick={onClearCart}
            className="mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--line)",
              background: "#fff",
              color: "var(--plum-soft)",
            }}
          >
            مسح السلة
          </button>
        </aside>
      </div>
    </div>
  );
}
