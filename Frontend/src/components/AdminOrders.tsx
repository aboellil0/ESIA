import { useEffect, useState } from "react";

interface OrderItem {
  name: string;
  color: string;
  size: string;
  qty: number;
}
interface Order {
  id: string;
  time: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: string;
  receiptImage: string;
}

const makeReceiptArt = (label: string, start: string, end: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}"/>
          <stop offset="100%" stop-color="${end}"/>
        </linearGradient>
      </defs>
      <rect width="900" height="600" fill="url(#g)"/>
      <rect x="80" y="80" width="740" height="440" rx="18" fill="rgba(255,255,255,0.12)"/>
      <text x="50%" y="48%" text-anchor="middle" fill="#fff" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">ESIA</text>
      <text x="50%" y="58%" text-anchor="middle" fill="#fff" font-size="28" font-family="Segoe UI, Arial, sans-serif">${label}</text>
    </svg>
  `)}`;

const INITIAL_ORDERS: Order[] = [
  {
    id: "ESIA-2026-000482",
    time: "منذ 12 دقيقة",
    customer: "سارة أحمد",
    phone: "+201012345678",
    items: [{ name: "Rosalind Puff Dress", color: "وردي", size: "M", qty: 1 }],
    total: 760,
    status: "pending",
    receiptImage: makeReceiptArt("إيصال الطلب", "#f4dcd8", "#9c5b66"),
  },
  {
    id: "ESIA-2026-000481",
    time: "منذ 40 دقيقة",
    customer: "مروة سامي",
    phone: "+201098765432",
    items: [
      { name: "Meadow Tiered Dress", color: "كاكي", size: "L", qty: 1 },
      { name: "Aria Bow Suit", color: "عاجي", size: "S", qty: 1 },
    ],
    total: 1550,
    status: "pending",
    receiptImage: makeReceiptArt("إيصال الطلب", "#e5d3d2", "#7c5d54"),
  },
  {
    id: "ESIA-2026-000480",
    time: "منذ ساعتين",
    customer: "ندى حسن",
    phone: "+201122334455",
    items: [
      { name: "Elara Structured Abaya", color: "أسود", size: "M", qty: 1 },
    ],
    total: 1000,
    status: "in_progress",
    receiptImage: makeReceiptArt("إيصال الطلب", "#dfe6de", "#4b5d57"),
  },
  {
    id: "ESIA-2026-000479",
    time: "أمس، 9:14 م",
    customer: "ياسمين طارق",
    phone: "+201234567890",
    items: [{ name: "Noor Maxi Dress", color: "وردي", size: "L", qty: 2 }],
    total: 1440,
    status: "shipped",
    receiptImage: makeReceiptArt("إيصال الطلب", "#f7e2d2", "#b0895d"),
  },
  {
    id: "ESIA-2026-000478",
    time: "أمس، 4:02 م",
    customer: "هبة الله عادل",
    phone: "+201555667788",
    items: [{ name: "Wisteria Twirl Dress", color: "كاكي", size: "M", qty: 1 }],
    total: 880,
    status: "delivered",
    receiptImage: makeReceiptArt("إيصال الطلب", "#efe5d8", "#8a7a66"),
  },
  {
    id: "ESIA-2026-000477",
    time: "قبل يومين",
    customer: "رنا عصام",
    phone: "+201099887766",
    items: [{ name: "Aria Bow Suit", color: "أسود", size: "M", qty: 1 }],
    total: 800,
    status: "cancelled",
    receiptImage: makeReceiptArt("إيصال الطلب", "#cdd5de", "#5c677f"),
  },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "لسه ما اتشافش",
  in_progress: "جاري التنفيذ",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    pending: { bg: "#F3E6D8", text: "#C08A2E", dot: "#C08A2E" },
    in_progress: { bg: "#E4ECF4", text: "#3A6EA8", dot: "#3A6EA8" },
    shipped: { bg: "#EAE6F4", text: "#6C4EA8", dot: "#6C4EA8" },
    delivered: { bg: "#E4EFE4", text: "#5C8A5C", dot: "#5C8A5C" },
    cancelled: { bg: "#F4E1E1", text: "#B03A3A", dot: "#B03A3A" },
  };

const TABS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "لسه ما اتشافش" },
  { key: "in_progress", label: "جاري التنفيذ" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التسليم" },
  { key: "cancelled", label: "ملغي" },
];

export default function AdminOrders({
  orders: incomingOrders,
  onNavigate,
}: {
  orders?: Order[];
  onNavigate: (v: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>(
    incomingOrders && incomingOrders.length ? incomingOrders : INITIAL_ORDERS,
  );
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setOrders(
      incomingOrders && incomingOrders.length ? incomingOrders : INITIAL_ORDERS,
    );
  }, [incomingOrders]);

  const changeStatus = (id: string, status: string) => {
    if (!status) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const filtered = orders
    .filter((o) => activeTab === "all" || o.status === activeTab)
    .filter((o) => {
      const q = search.trim().toLowerCase();
      return !q || o.id.toLowerCase().includes(q) || o.customer.includes(q);
    });

  const pending = orders.filter((o) => o.status === "pending").length;
  const inProgress = orders.filter((o) => o.status === "in_progress").length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-full" style={{ background: "var(--ivory)" }}>
      {selectedReceipt ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-[28px] border border-white/20 bg-white p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold shadow-lg"
              style={{ color: "var(--rose-deep)" }}
            >
              ×
            </button>
            <img
              src={selectedReceipt}
              alt="إيصال التحويل الكامل"
              className="max-h-[80vh] w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      ) : null}
      {/* Topbar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div
          className="flex items-center gap-2.5 font-marcellus tracking-[0.12em] text-[19px]"
          style={{ color: "var(--rose-deep)" }}
        >
          ESIA
          <span
            className="text-xs font-medium tracking-normal"
            style={{
              fontFamily: "Tajawal",
              color: "var(--plum-soft)",
              borderInlineStart: "1px solid var(--line)",
              paddingInlineStart: 10,
            }}
          >
            لوحة التحكم
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <button
              onClick={() => onNavigate("home")}
              className="px-4 py-2 rounded-full text-xs font-semibold border"
              style={{
                background: "#fff",
                borderColor: "var(--line)",
                color: "var(--plum-soft)",
              }}
            >
              المتجر
            </button>
            <button
              onClick={() => onNavigate("admin-orders")}
              className="px-4 py-2 rounded-full text-xs font-semibold border"
              style={{
                background: "var(--rose-deep)",
                borderColor: "var(--rose-deep)",
                color: "#fff",
              }}
            >
              الطلبات
            </button>
            <button
              onClick={() => onNavigate("admin-products")}
              className="px-4 py-2 rounded-full text-xs font-semibold border"
              style={{
                background: "#fff",
                borderColor: "var(--line)",
                color: "var(--plum-soft)",
              }}
            >
              المنتجات
            </button>
          </div>
          <div
            className="flex items-center gap-2.5 text-sm"
            style={{ color: "var(--plum-soft)" }}
          >
            <span>مرحباً، أدمن</span>
            <div
              className="w-8 h-8 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--rose), var(--rose-deep))",
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-5 py-7 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
          {[
            { num: orders.length, label: "إجمالي الطلبات" },
            { num: pending, label: "بانتظار البدء" },
            { num: inProgress, label: "جاري تنفيذها" },
            {
              num: `${revenue.toLocaleString()} ج.م`,
              label: "إجمالي المبيعات",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4"
              style={{ border: "1px solid var(--line)" }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--rose-deep)" }}
              >
                {s.num}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--plum-soft)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3.5 mb-4 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
                style={
                  activeTab === t.key
                    ? {
                        background: "var(--rose-deep)",
                        borderColor: "var(--rose-deep)",
                        color: "#fff",
                      }
                    : {
                        background: "#fff",
                        borderColor: "var(--line)",
                        color: "var(--plum-soft)",
                      }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <div
            className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2.5"
            style={{ border: "1px solid var(--line)", minWidth: 220 }}
          >
            <svg
              className="w-[15px] h-[15px] flex-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              style={{ color: "var(--plum-soft)" }}
            >
              <circle cx={11} cy={11} r={7} />
              <line x1={21} y1={21} x2={16.6} y2={16.6} />
            </svg>
            <input
              className="border-none outline-none bg-transparent text-sm w-full"
              style={{ color: "var(--plum)" }}
              placeholder="ابحثي برقم الطلب أو اسم العميلة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--line)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr
                  style={{
                    background: "var(--ivory-deep)",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {[
                    "رقم الطلب",
                    "العميلة",
                    "المنتجات",
                    "إيصال التحويل",
                    "الإجمالي",
                    "الحالة",
                    "الإجراء",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-right px-4 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.03em]"
                      style={{ color: "var(--plum-soft)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-16 text-sm"
                      style={{ color: "var(--plum-soft)" }}
                    >
                      لا توجد طلبات مطابقة
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const st = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;
                    return (
                      <tr
                        key={o.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--line)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--blush-soft)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                      >
                        <td className="px-4 py-3.5">
                          <div
                            className="font-bold text-sm dir-ltr"
                            style={{ color: "var(--plum)" }}
                          >
                            {o.id}
                          </div>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--gray)" }}
                          >
                            {o.time}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-sm">
                            {o.customer}
                          </div>
                          <div
                            className="text-xs dir-ltr inline-block"
                            style={{ color: "var(--plum-soft)" }}
                          >
                            {o.phone}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div
                            className="text-xs leading-relaxed"
                            style={{ color: "var(--plum-soft)", maxWidth: 220 }}
                          >
                            {o.items.map((it, i) => (
                              <div key={i}>
                                <span
                                  className="font-semibold dir-ltr inline-block"
                                  style={{ color: "var(--plum)" }}
                                >
                                  {it.name}
                                </span>{" "}
                                — {it.color} / {it.size}
                                {it.qty > 1 ? ` × ${it.qty}` : ""}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={o.receiptImage}
                              alt={`إيصال الطلب ${o.id}`}
                              onClick={() => setSelectedReceipt(o.receiptImage)}
                              className="w-16 h-16 object-cover rounded-xl border cursor-pointer"
                              style={{ borderColor: "var(--line)" }}
                            />
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: "var(--plum-soft)" }}
                            >
                              صورة التحويل
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3.5 font-bold text-sm"
                          style={{ color: "var(--rose-deep)" }}
                        >
                          {o.total.toLocaleString()} ج.م
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: st.bg, color: st.text }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: st.dot }}
                            />
                            {STATUS_LABELS[o.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-2 items-center">
                            <button
                              disabled={o.status !== "pending"}
                              onClick={() => changeStatus(o.id, "in_progress")}
                              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-default"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--rose), var(--rose-deep))",
                              }}
                            >
                              {o.status === "in_progress"
                                ? "جاري التنفيذ"
                                : "ابدئي التنفيذ"}
                            </button>
                            <select
                              className="rounded-lg px-2 py-1.5 text-xs outline-none"
                              style={{
                                border: "1px solid var(--line)",
                                color: "var(--plum-soft)",
                                background: "#fff",
                              }}
                              value=""
                              onChange={(e) =>
                                changeStatus(o.id, e.target.value)
                              }
                            >
                              <option value="">تغيير الحالة</option>
                              {Object.entries(STATUS_LABELS)
                                .filter(([k]) => k !== o.status)
                                .map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
