import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import ProductDetail from "./components/ProductDetail";
import AdminOrders from "./components/AdminOrders";
import AdminProducts from "./components/AdminProducts";
import Checkout from "./components/Checkout";
import Storefront from "./components/Storefront";
import AuthPage from "./components/AuthPage";
import { getDemoUser } from "./lib/demoAuth";

export type View =
  | "home"
  | "dresses"
  | "bags"
  | "accessories"
  | "story"
  | "product"
  | "checkout"
  | "auth"
  | "admin-orders"
  | "admin-products";

export interface CartItem {
  variantKey: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  qty: number;
}

export interface OrderItemSummary {
  name: string;
  color: string;
  size: string;
  qty: number;
}

export interface Order {
  id: string;
  time: string;
  customer: string;
  phone: string;
  items: OrderItemSummary[];
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
];

const STORE_VIEWS: View[] = [
  "home",
  "dresses",
  "bags",
  "accessories",
  "story",
  "product",
];

const getViewFromPath = (pathname: string): View => {
  switch (pathname) {
    case "/":
      return "home";
    case "/dresses":
      return "dresses";
    case "/bags":
      return "bags";
    case "/accessories":
      return "accessories";
    case "/story":
      return "story";
    case "/checkout":
      return "checkout";
    case "/auth":
      return "auth";
    case "/admin-orders":
      return "admin-orders";
    case "/admin-products":
      return "admin-products";
    default:
      if (pathname.startsWith("/product/")) return "product";
      return "home";
  }
};

const getRouteTarget = (view: string, productId?: string) => {
  switch (view) {
    case "home":
      return "/";
    case "dresses":
      return "/dresses";
    case "bags":
      return "/bags";
    case "accessories":
      return "/accessories";
    case "story":
      return "/story";
    case "product":
      return productId ? `/product/${encodeURIComponent(productId)}` : "/";
    case "checkout":
      return "/checkout";
    case "auth":
      return "/auth";
    case "admin-orders":
      return "/admin-orders";
    case "admin-products":
      return "/admin-products";
    default:
      return "/";
  }
};

function ProductRoute({
  cart,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  onNavigate,
}: {
  cart: number;
  onAddToCart: (item: Omit<CartItem, "variantKey"> & { qty: number }) => void;
  wishlist: boolean;
  onToggleWishlist: () => void;
  onNavigate: (v: string, productId?: string) => void;
}) {
  const { productId = "rogeena" } = useParams();

  return (
    <ProductDetail
      key={productId}
      productId={productId}
      onNavigate={onNavigate}
      cart={cart}
      onAddToCart={onAddToCart}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
    />
  );
}

function DemoAppShell() {
  const demoUser = getDemoUser();
  const signOut = {
    signOut: async () => {
      localStorage.removeItem("esia-demo-auth-user");
      window.location.reload();
    },
  };

  return <AppShell user={demoUser} isLoading={false} signOut={signOut} />;
}

function AppShell({
  user,
  isLoading,
  signOut,
}: {
  user: any;
  isLoading: boolean;
  signOut: { signOut: () => Promise<void> };
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [wishlist, setWishlist] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const ADMIN_EMAIL = "admin@yourstore.com";
  const isAdminUser = (email?: string | null) => {
    if (!email) return false;
    const normalized = email.toLowerCase();
    return (
      normalized === ADMIN_EMAIL.toLowerCase() || normalized.includes("admin")
    );
  };

  useEffect(() => {
    if (
      user &&
      isAdminUser(user.email) &&
      !["/admin-orders", "/admin-products", "/auth"].includes(location.pathname)
    ) {
      navigate("/admin-orders");
    }
  }, [navigate, user, location.pathname]);

  const view = getViewFromPath(location.pathname);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const isAdmin = isAdminUser(user?.email);

  useEffect(() => {
    if (user) {
      setShowWelcomeModal(false);
      setIsGuestMode(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] text-[#382530]">
        <p className="text-lg font-medium">Loading...</p>
      </main>
    );
  }

  const handleGuestContinue = () => {
    setIsGuestMode(true);
    setShowWelcomeModal(false);
    navigate("/");
  };

  const handleOpenAuth = () => {
    setIsGuestMode(false);
    setShowWelcomeModal(false);
    navigate("/auth");
  };

  if (!user && location.pathname === "/auth") {
    return <AuthPage />;
  }

  if (!user && !isGuestMode && showWelcomeModal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f7] p-6 text-[#382530]">
        <div className="w-full max-w-md rounded-4xl border border-[#f0d9df] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(56,37,48,0.4)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4f63]">
            ESIA
          </p>
          <h1 className="mt-4 text-3xl font-semibold">مرحبا بك</h1>
          <p className="mt-2 text-sm text-[#6b5460]">
            اختَر طريقة الدخول المناسبة لك، ويمكنك المستقبِل تسجيل الدخول كـ
            admin أو كـ مستخدم عادي.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleGuestContinue}
              className="w-full rounded-2xl bg-[#382530] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#271d25]"
            >
              الدخول كضيف
            </button>
            <button
              type="button"
              onClick={handleOpenAuth}
              className="w-full rounded-2xl border border-[#d6b0ba] bg-[#fff4f3] px-4 py-3 text-base font-semibold text-[#382530] transition hover:bg-[#fdebf0]"
            >
              تسجيل الدخول / إنشاء حساب
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (
    !user &&
    isGuestMode &&
    (view === "admin-orders" || view === "admin-products")
  ) {
    return <Navigate to="/" replace />;
  }

  if (
    !user &&
    !isGuestMode &&
    (view === "admin-orders" || view === "admin-products")
  ) {
    return <Navigate to="/" replace />;
  }

  if (!user && !isGuestMode) {
    return <AuthPage />;
  }

  if (!isAdmin && (view === "admin-orders" || view === "admin-products")) {
    return <Navigate to="/" replace />;
  }

  const redirect = (v: string, id?: string) => {
    navigate(getRouteTarget(v, id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    await signOut.signOut();
    navigate("/auth");
  };

  const addToCart = ({
    productId,
    name,
    price,
    size,
    color,
    image,
    qty,
  }: Omit<CartItem, "variantKey"> & { qty: number }) => {
    setCartItems((prev) => {
      const variantKey = `${productId}-${size}-${color}`;
      const existingIndex = prev.findIndex(
        (item) => item.variantKey === variantKey,
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          qty: next[existingIndex].qty + qty,
        };
        return next;
      }

      return [
        ...prev,
        { variantKey, productId, name, price, size, color, image, qty },
      ];
    });
  };

  const updateItemQty = (variantKey: string, nextQty: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.variantKey === variantKey ? { ...item, qty: nextQty } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const removeItem = (variantKey: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.variantKey !== variantKey),
    );
  };

  const clearCart = () => setCartItems([]);

  const placeOrder = async ({
    customer,
    phone,
    items,
    total,
    receiptImage,
  }: {
    customer: string;
    phone: string;
    items: CartItem[];
    total: number;
    receiptImage: string;
  }) => {
    const orderId = `ESIA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;

    const nextOrder: Order = {
      id: orderId,
      time: "الآن",
      customer,
      phone,
      items: items.map((item) => ({
        name: item.name,
        color: item.color,
        size: item.size,
        qty: item.qty,
      })),
      total,
      status: "pending",
      receiptImage,
    };

    setOrders((prev) => [nextOrder, ...prev]);
  };

  const isStore = STORE_VIEWS.includes(view);
  const isAdminPage = view === "admin-orders" || view === "admin-products";
  const visibleNavItems: { key: View; label: string; icon: string }[] = [
    { key: "auth", label: "الحساب", icon: "🔐" },
  ];

  if (isAdmin && isAdminPage) {
    visibleNavItems.unshift(
      { key: "admin-orders", label: "الطلبات", icon: "📦" },
      { key: "admin-products", label: "المنتجات", icon: "✏️" },
    );
  } else {
    visibleNavItems.unshift({ key: "home", label: "المتجر", icon: "🛍" });
  }

  if (!user && !isGuestMode && location.pathname !== "/auth") {
    return null;
  }

  return (
    <div className="min-h-full">
      <div
        className="fixed bottom-5 left-1/2 z-50 flex items-center gap-1 px-2 py-2 rounded-2xl shadow-xl"
        style={{
          transform: "translateX(-50%)",
          background: "rgba(56,37,48,0.92)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 30px -8px rgba(56,37,48,0.5)",
        }}
      >
        {visibleNavItems.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => redirect(key)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            style={
              (key === "home" ? isStore : view === key)
                ? { background: "var(--rose-deep)", color: "#fff" }
                : { background: "transparent", color: "rgba(255,255,255,0.6)" }
            }
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}

        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/20 bg-[#fff4f3] px-3 py-2 text-[10px] font-bold text-[#382530] transition hover:bg-white"
          >
            🚪 خروج
          </button>
        ) : null}
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <Storefront
              view="home"
              onNavigate={redirect}
              cart={cartCount}
              wishlist={wishlist}
              onToggleWishlist={() => setWishlist((w) => !w)}
            />
          }
        />
        <Route
          path="/dresses"
          element={
            <Storefront
              view="dresses"
              onNavigate={redirect}
              cart={cartCount}
              wishlist={wishlist}
              onToggleWishlist={() => setWishlist((w) => !w)}
            />
          }
        />
        <Route
          path="/bags"
          element={
            <Storefront
              view="bags"
              onNavigate={redirect}
              cart={cartCount}
              wishlist={wishlist}
              onToggleWishlist={() => setWishlist((w) => !w)}
            />
          }
        />
        <Route
          path="/accessories"
          element={
            <Storefront
              view="accessories"
              onNavigate={redirect}
              cart={cartCount}
              wishlist={wishlist}
              onToggleWishlist={() => setWishlist((w) => !w)}
            />
          }
        />
        <Route
          path="/story"
          element={
            <Storefront
              view="story"
              onNavigate={redirect}
              cart={cartCount}
              wishlist={wishlist}
              onToggleWishlist={() => setWishlist((w) => !w)}
            />
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ProductRoute
              cart={cartCount}
              onAddToCart={addToCart}
              wishlist={wishlist}
              onToggleWishlist={() => setWishlist((w) => !w)}
              onNavigate={redirect}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <Checkout
              items={cartItems}
              onNavigate={redirect}
              onRemoveItem={removeItem}
              onUpdateQty={updateItemQty}
              onClearCart={clearCart}
              onPlaceOrder={placeOrder}
            />
          }
        />
        <Route
          path="/admin-orders"
          element={<AdminOrders orders={orders} onNavigate={redirect} />}
        />
        <Route
          path="/admin-products"
          element={<AdminProducts onNavigate={redirect} />}
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoAppShell />
    </BrowserRouter>
  );
}
