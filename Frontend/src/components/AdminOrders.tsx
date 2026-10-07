import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../lib/api";
import { ordersService } from "../services/orders";

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city?: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  trackingNumber?: string | null;
  notes?: string | null;
  proofImageUrl?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  items?: Array<{ id: number; productName: string; quantity: number; unitPrice: number; size?: string | null; colorNameAr?: string | null; colorNameEn?: string | null }>;
};

const statuses = ["pending", "pending_payment", "accepted", "rejected", "shipped", "delivered", "cancelled"];
const statusName: Record<string, string> = {
  pending: "قيد المراجعة",
  pending_payment: "بانتظار الدفع",
  accepted: "مقبول",
  rejected: "مرفوض",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};
const inputClass = "rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-[#9a4f63]";
const buttonClass = "rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50";

export default function AdminOrders({ onNavigate, onLogout }: { onNavigate: (view: string) => void; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nextStatus, setNextStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      });
      setOrders(Array.isArray(result?.orders) ? result.orders : []);
      setTotalPages(Math.max(1, Number(result?.pagination?.totalPages ?? 1)));
    } catch (loadError) {
      setOrders([]);
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const openOrder = async (id: number) => {
    setBusy(true);
    setError(null);
    try {
      const order = await ordersService.byId(id) as Order;
      setSelected(order);
      setNextStatus(order.status);
      setTrackingNumber(order.trackingNumber ?? "");
      setNotes(order.notes ?? "");
      setRejectionReason(order.rejectionReason ?? "");
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setBusy(false);
    }
  };

  const saveStatus = async () => {
    if (!selected || !nextStatus) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await ordersService.updateStatus(selected.id, { status: nextStatus, trackingNumber: trackingNumber.trim() || undefined }) as Order;
      setSelected(updated);
      setNotice("تم تحديث حالة الطلب.");
      await loadOrders();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const verifyPayment = async (action: "verify" | "reject") => {
    if (!selected) return;
    if (action === "reject" && !rejectionReason.trim()) {
      setError("اكتب سبب رفض الدفع أولاً.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await ordersService.verifyPayment(selected.id, {
        action,
        rejectionReason: action === "reject" ? rejectionReason.trim() : undefined,
      }) as Order;
      setSelected(updated);
      setNotice(action === "verify" ? "تم اعتماد الدفع." : "تم رفض الدفع.");
      await loadOrders();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await ordersService.updateNotes(selected.id, notes) as Order;
      setSelected(updated);
      setNotice("تم حفظ الملاحظات.");
      await loadOrders();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--ivory)" }}>
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
        <div><strong className="font-marcellus text-xl" style={{ color: "var(--rose-deep)" }}>ESIA</strong><span className="ms-3 text-sm">إدارة الطلبات</span></div>
        <nav className="flex flex-wrap gap-2">
          <button className={buttonClass + " text-white"} style={{ background: "var(--rose-deep)" }}>الطلبات</button>
          <button className={buttonClass + " border"} onClick={() => onNavigate("admin-products")}>المنتجات</button>
          <button className={buttonClass + " border"} onClick={() => onNavigate("admin-catalog")}>الفئات والألوان</button>
          <button className={buttonClass + " border"} onClick={onLogout}>تسجيل الخروج</button>
        </nav>
      </header>
      <div className="mx-auto max-w-[1260px] px-5 py-8">
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => void loadOrders()} className="ms-3 underline">إعادة المحاولة</button></p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
        <section className="mb-5 flex flex-wrap gap-3 rounded-2xl bg-white p-4" style={{ border: "1px solid var(--line)" }}>
          <select aria-label="حالة الطلب" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={inputClass}><option value="">كل حالات الطلب</option>{statuses.map((status) => <option key={status} value={status}>{statusName[status]}</option>)}</select>
          <select aria-label="حالة الدفع" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1); }} className={inputClass}><option value="">كل حالات الدفع</option><option value="not_submitted">لم يرسل</option><option value="submitted">مقدم للمراجعة</option><option value="verified">تم التحقق</option><option value="rejected">مرفوض</option></select>
        </section>
        {loading ? <p role="status" className="py-16 text-center">جارٍ تحميل الطلبات...</p> : error ? null : orders.length === 0 ? <p className="rounded-2xl bg-white py-16 text-center" style={{ color: "var(--plum-soft)" }}>لا توجد طلبات حالياً.</p> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {orders.map((order) => (
              <button key={order.id} type="button" onClick={() => void openOrder(order.id)} className="rounded-2xl bg-white p-5 text-right shadow-sm" style={{ border: "1px solid var(--line)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold" style={{ color: "var(--plum)" }}>{order.orderNumber}</p><p className="mt-1 text-sm">{order.customerName} · {order.phone}</p><p className="text-xs text-gray-500">{order.email}</p></div>
                  <span className="rounded-full bg-[#fbedef] px-3 py-1 text-xs">{statusName[order.status] ?? order.status}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm"><span>{new Date(order.createdAt).toLocaleString("ar-EG")}</span><strong>{Number(order.totalAmount).toLocaleString()} ج.م</strong></div>
                <p className="mt-2 text-xs text-gray-600">حالة الدفع: {order.paymentStatus}</p>
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className={buttonClass + " border"}>السابق</button>
          <span className="text-sm">صفحة {page} من {totalPages}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className={buttonClass + " border"}>التالي</button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="تفاصيل الطلب">
          <div className="mx-auto my-8 max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs text-gray-500">تفاصيل الطلب</p><h2 className="mt-1 text-2xl font-bold">{selected.orderNumber}</h2></div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2">إغلاق</button>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <p><strong>العميل:</strong> {selected.customerName}</p><p><strong>الهاتف:</strong> {selected.phone}</p>
              <p><strong>البريد:</strong> {selected.email}</p><p><strong>الدفع:</strong> {selected.paymentStatus}</p>
              <p className="sm:col-span-2"><strong>العنوان:</strong> {selected.address}{selected.city ? "، " + selected.city : ""}</p>
            </div>
            <div className="mt-5 space-y-2">{selected.items?.map((item) => <div key={item.id} className="flex justify-between rounded-xl bg-[#fbf5ef] p-3 text-sm"><span>{item.productName} · {item.colorNameAr ?? item.colorNameEn ?? "—"} · {item.size ?? "—"} × {item.quantity}</span><span>{Number(item.unitPrice).toLocaleString()} ج.م</span></div>)}</div>
            <p className="mt-4 text-left text-lg font-bold" style={{ color: "var(--rose-deep)" }}>الإجمالي: {Number(selected.totalAmount).toLocaleString()} ج.م</p>
            {selected.proofImageUrl && <div className="mt-4"><p className="mb-2 text-sm font-semibold">إيصال الدفع</p><a href={selected.proofImageUrl} target="_blank" rel="noreferrer"><img src={selected.proofImageUrl} alt="إيصال الدفع" className="max-h-64 rounded-xl border object-contain" /></a></div>}

            {selected.paymentStatus === "submitted" && (
              <section className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
                <h3 className="font-bold">مراجعة الدفع</h3>
                <label className="mt-3 block text-sm">سبب الرفض عند الحاجة<input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className={inputClass + " mt-1 w-full"} /></label>
                <div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => void verifyPayment("verify")} className={buttonClass + " text-white"} style={{ background: "var(--green)" }}>اعتماد الدفع</button><button type="button" disabled={busy} onClick={() => void verifyPayment("reject")} className={buttonClass + " bg-red-50 text-red-700"}>رفض الدفع</button></div>
              </section>
            )}

            <section className="mt-6 grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_1fr_auto]" style={{ borderColor: "var(--line)" }}>
              <label className="text-sm">حالة الطلب<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className={inputClass + " mt-1 w-full"}>{statuses.map((status) => <option key={status} value={status}>{statusName[status]}</option>)}</select></label>
              <label className="text-sm">رقم التتبع<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} className={inputClass + " mt-1 w-full"} dir="ltr" /></label>
              <button type="button" disabled={busy || nextStatus === selected.status} onClick={() => void saveStatus()} className={buttonClass + " self-end text-white"} style={{ background: "var(--rose-deep)" }}>حفظ الحالة</button>
            </section>
            <section className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
              <label className="block text-sm font-semibold">ملاحظات الطلب<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass + " mt-2 w-full"} /></label>
              <button type="button" disabled={busy} onClick={() => void saveNotes()} className={buttonClass + " mt-3 text-white"} style={{ background: "var(--rose-deep)" }}>حفظ الملاحظات</button>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
