import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { ordersService } from "../services/orders";

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

export default function TrackOrder({ initialOrderNumber, onNavigate }: { initialOrderNumber?: string; onNavigate: (view: string, value?: string) => void }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? "");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await ordersService.track(orderNumber.trim()));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) void track();
  }, [initialOrderNumber]);

  return (
    <main className="mx-auto min-h-screen max-w-[900px] px-5 py-12">
      <div className="mb-7 flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.14em]" style={{ color: "var(--gold)" }}>ORDER STATUS</p><h1 className="mt-2 font-marcellus text-3xl">تتبّع طلبك</h1></div><button type="button" onClick={() => onNavigate("home")} className="rounded-xl border bg-white px-4 py-2 text-sm">المتجر</button></div>
      <form onSubmit={track} className="flex flex-wrap gap-3 rounded-2xl border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <label className="min-w-[230px] flex-1 text-sm">رقم الطلب<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="ESIA-..." dir="ltr" className="mt-1 w-full rounded-xl border px-3 py-3 outline-none" /></label>
        <button type="submit" disabled={loading} className="self-end rounded-xl px-5 py-3 font-bold text-white disabled:opacity-50" style={{ background: "var(--rose-deep)" }}>{loading ? "جارٍ البحث..." : "تتبّع"}</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!loading && !error && !order && <p className="mt-6 rounded-2xl bg-white p-5 text-center text-sm" style={{ color: "var(--plum-soft)" }}>أدخلي رقم الطلب لعرض حالته.</p>}
      {order && <section className="mt-6 rounded-2xl border bg-white p-6" style={{ borderColor: "var(--line)" }}><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-xl font-bold">{order.orderNumber}</h2><span className="rounded-full bg-[#fbedef] px-3 py-1 text-sm">{statusLabels[order.status] ?? order.status}</span></div><p className="mt-3 text-sm">حالة الدفع: {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}</p>{order.createdAt && <p className="mt-2 text-sm">تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString("ar-EG")}</p>}{order.trackingNumber && <p className="mt-2 text-sm">رقم الشحنة: <b dir="ltr">{order.trackingNumber}</b></p>}<div className="mt-5 space-y-2">{order.items?.map((item: any, index: number) => <div key={item.id ?? index} className="flex justify-between rounded-xl bg-[#fbf5ef] p-3 text-sm"><span>{item.productName} × {item.quantity}</span><span>{Number(item.unitPrice).toLocaleString()} ج.م</span></div>)}</div><p className="mt-4 text-left font-bold">الإجمالي: {Number(order.totalAmount).toLocaleString()} ج.م</p></section>}
    </main>
  );
}
