import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../lib/api";
import { ordersService } from "../services/orders";

type OrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
};

export default function MyOrders({ onNavigate }: { onNavigate: (view: string, value?: string) => void }) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.myOrders({ page: 1, limit: 20 });
      setOrders(Array.isArray(result?.orders) ? result.orders : []);
    } catch (loadError) {
      setOrders([]);
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openOrder = async (id: number) => {
    setBusy(true);
    setError(null);
    try {
      setSelected(await ordersService.myOrderById(id));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1000px] px-5 py-10">
      <div className="mb-7 flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.14em]" style={{ color: "var(--gold)" }}>ESIA ACCOUNT</p><h1 className="mt-2 font-marcellus text-3xl">طلباتي</h1></div><button type="button" onClick={() => onNavigate("home")} className="rounded-xl border bg-white px-4 py-2 text-sm">المتجر</button></div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => void load()} className="ms-3 underline">إعادة المحاولة</button></p>}
      {loading ? <p role="status" className="py-16 text-center">جارٍ تحميل الطلبات...</p> : error ? null : orders.length === 0 ? (
        <section className="rounded-2xl border bg-white p-10 text-center" style={{ borderColor: "var(--line)" }}><p>لا توجد طلبات مرتبطة بهذا الحساب.</p><button type="button" onClick={() => void load()} className="mt-4 underline">إعادة التحميل</button></section>
      ) : (
        <div className="space-y-3">{orders.map((order) => <button type="button" key={order.id} onClick={() => void openOrder(order.id)} disabled={busy} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 text-right" style={{ borderColor: "var(--line)" }}><span><strong className="block">{order.orderNumber}</strong><span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("ar-EG")}</span></span><span>{order.status} · {order.paymentStatus}</span><strong>{Number(order.totalAmount).toLocaleString()} ج.م</strong></button>)}</div>
      )}
      {selected && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true"><section className="mx-auto my-10 max-w-2xl rounded-3xl bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">{selected.orderNumber}</h2><button type="button" onClick={() => setSelected(null)}>إغلاق</button></div><p className="mt-3 text-sm">الحالة: {selected.status} · الدفع: {selected.paymentStatus}</p><div className="mt-5 space-y-2">{selected.items?.map((item: any) => <div key={item.id} className="flex justify-between rounded-xl bg-[#fbf5ef] p-3 text-sm"><span>{item.productName} × {item.quantity} · {item.size ?? "—"}</span><span>{Number(item.unitPrice).toLocaleString()} ج.م</span></div>)}</div><p className="mt-4 text-left font-bold">الإجمالي: {Number(selected.totalAmount).toLocaleString()} ج.م</p></section></div>}
    </main>
  );
}
