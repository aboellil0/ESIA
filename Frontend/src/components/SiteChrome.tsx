import { useState } from "react";
import type { CatalogProduct } from "../data/catalog";

export const NAV_ITEMS = [
  { view: "home", label: "الرئيسية" },
  { view: "dresses", label: "الفساتين" },
  { view: "bags", label: "الحقائب" },
  { view: "accessories", label: "الإكسسوارات" },
  { view: "story", label: "قصتنا" },
] as const;

export type StoreView = (typeof NAV_ITEMS)[number]["view"] | "product";

function BrandLogo({ compact = false }: { compact?: boolean }) {
  const [showFallback, setShowFallback] = useState(false);

  if (showFallback) {
    return (
      <div
        className="brand-logo"
        style={{
          width: compact ? 120 : 200,
          maxWidth: "100%",
          display: "inline-block",
        }}
      >
        <svg
          viewBox="0 0 620 320"
          role="img"
          aria-label="ESIA logo"
          style={{ display: "block", width: "100%", height: "auto" }}
        >
          <defs>
            <linearGradient id="brandRose" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5d8e3" />
              <stop offset="50%" stopColor="#e4a9bb" />
              <stop offset="100%" stopColor="#cf7d95" />
            </linearGradient>
            <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5e6ba" />
              <stop offset="40%" stopColor="#d7b975" />
              <stop offset="100%" stopColor="#b88236" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="6"
                stdDeviation="6"
                floodColor="#b97a8a"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          <g filter="url(#softGlow)">
            <path
              d="M90 85 C 120 20, 220 20, 240 80 C 280 40, 335 38, 310 98 C 355 96, 430 98, 455 70 C 480 38, 560 45, 600 100 C 565 116, 525 120, 490 113 C 510 150, 515 181, 476 200 C 448 238, 367 239, 312 210 C 263 240, 176 236, 122 198 C 82 170, 82 131, 90 85Z"
              fill="url(#brandRose)"
              opacity="0.9"
            />
            <path
              d="M150 84 C 193 39, 245 58, 279 70 C 248 88, 244 118, 218 145 C 186 133, 164 112, 150 84Z"
              fill="#f5cfd9"
              opacity="0.75"
            />
            <path
              d="M470 84 C 427 39, 375 58, 341 70 C 372 88, 376 118, 402 145 C 434 133, 456 112, 470 84Z"
              fill="#f5cfd9"
              opacity="0.75"
            />
          </g>

          <g transform="translate(310, 150)" textAnchor="middle">
            <text
              x="0"
              y="0"
              fontSize="136"
              fontWeight="700"
              fontFamily="Georgia, 'Times New Roman', serif"
              fill="url(#brandRose)"
              stroke="url(#brandGold)"
              strokeWidth="2.5"
              letterSpacing="1"
            >
              ESIA
            </text>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      className="brand-logo"
      style={{
        width: compact ? 122 : 218,
        maxWidth: "100%",
        display: "inline-block",
      }}
    >
      <img
        src="/logo.png"
        alt="ESIA logo"
        onError={() => setShowFallback(true)}
        style={{
          display: "block",
          width: "70%",
          height: "auto",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

interface ChromeProps {
  view: string;
  onNavigate: (v: string, productId?: string) => void;
  cart: number;
  wishlist: boolean;
  onToggleWishlist?: () => void;
  children: React.ReactNode;
}

export function SiteChrome({
  view,
  onNavigate,
  cart,
  wishlist,
  onToggleWishlist,
  children,
}: ChromeProps) {
  const activeNav = view === "product" ? "home" : view;

  return (
    <div className="min-h-full flex flex-col" style={{ background: "#fff" }}>
      <nav
        className="sticky top-0 z-30 bg-white"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-[1260px] mx-auto px-3 sm:px-6 h-[96px] md:h-[112px] flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((link) => (
              <button
                key={link.view}
                type="button"
                onClick={() => onNavigate(link.view)}
                className="text-sm font-medium transition-colors bg-transparent border-none p-0"
                style={{
                  color:
                    activeNav === link.view
                      ? "var(--rose-deep)"
                      : "var(--plum-soft)",
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex flex-col items-center justify-center text-center bg-transparent border-none px-2"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BrandLogo compact />
              <div
                className="text-[7px] md:text-[8px] tracking-[0.22em] md:tracking-[0.25em] font-light mt-0.5"
                style={{ color: "var(--gold)", fontFamily: "Tajawal" }}
              >
                .
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate("checkout")}
              className="relative bg-transparent border-none p-0"
            >
              <IconBtn>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1={3} y1={6} x2={21} y2={6} />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </IconBtn>
              {cart > 0 && (
                <span
                  className="absolute -top-1 -start-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "var(--rose-deep)" }}
                >
                  {cart}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="md:hidden flex gap-2 overflow-x-auto px-3 pb-3 pt-1">
          {NAV_ITEMS.map((link) => (
            <button
              key={link.view}
              type="button"
              onClick={() => onNavigate(link.view)}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap"
              style={
                activeNav === link.view
                  ? {
                      background: "var(--rose-deep)",
                      color: "#fff",
                      border: "none",
                    }
                  : {
                      background: "#fff",
                      color: "var(--plum-soft)",
                      border: "1px solid var(--line)",
                    }
              }
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex-1">{children}</div>

      <footer
        className="mt-auto"
        style={{
          borderTop: "1px solid var(--line)",
          background: "var(--ivory-deep)",
        }}
      >
        <div className="max-w-[1260px] mx-auto px-3 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="mb-3 bg-transparent border-none p-0"
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <BrandLogo compact />
              </button>
              <p
                className="text-xs leading-relaxed mb-4"
                style={{ color: "var(--plum-soft)" }}
              >
                نصنع الجمال لتمنحكن إطلالة ملكية تجمع بين أصالة التفاصيل وعصرية
                الروح رومانسية ساحرة.
              </p>
            </div>
            <div>
              <h4
                className="font-semibold text-sm mb-3"
                style={{ color: "var(--plum)" }}
              >
                تسوقي
              </h4>
              {[
                { label: "الرئيسية", view: "home" },
                { label: "مجموعة الفساتين", view: "dresses" },
                { label: "الحقائب", view: "bags" },
                { label: "الإكسسوارات", view: "accessories" },
              ].map((l) => (
                <button
                  key={l.view}
                  type="button"
                  onClick={() => onNavigate(l.view)}
                  className="block text-xs mb-2 bg-transparent border-none p-0"
                  style={{ color: "var(--plum-soft)" }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div>
              <h4
                className="font-semibold text-sm mb-3"
                style={{ color: "var(--plum)" }}
              >
                إيسيا
              </h4>
              <button
                type="button"
                onClick={() => onNavigate("story")}
                className="block text-xs mb-2 bg-transparent border-none p-0"
                style={{ color: "var(--plum-soft)" }}
              >
                قصتنا
              </button>
              <button
                type="button"
                onClick={() => onNavigate("admin-orders")}
                className="block text-xs mb-2 bg-transparent border-none p-0"
                style={{ color: "var(--plum-soft)" }}
              >
                لوحة الطلبات
              </button>
              <button
                type="button"
                onClick={() => onNavigate("admin-products")}
                className="block text-xs mb-2 bg-transparent border-none p-0"
                style={{ color: "var(--plum-soft)" }}
              >
                إدارة المنتجات
              </button>
            </div>
            <div>
              <h4
                className="font-semibold text-sm mb-2"
                style={{ color: "var(--plum)" }}
              >
                انضمي لعالم إيسيا
              </h4>
              <p
                className="text-xs leading-relaxed mb-3"
                style={{ color: "var(--plum-soft)" }}
              >
                اشتركي في نشرتنا البريدية لتصلك أحدث المجموعات والعروض الحصرية.
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="px-3.5 py-2.5 rounded-xl text-xs outline-none"
                  style={{
                    border: "1px solid var(--line)",
                    background: "#fff",
                    color: "var(--plum)",
                  }}
                />
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--rose), var(--rose-deep))",
                  }}
                >
                  اشتركي
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="border-t px-6 py-4 flex items-center justify-between"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="text-xs" style={{ color: "var(--gray)" }}>
            جميع الحقوق محفوظة © إيسيا ٢٠٢٦
          </p>
        </div>
      </footer>
    </div>
  );
}

export function ProductCard({
  item,
  onOpen,
}: {
  item: CatalogProduct;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="group rounded-2xl overflow-hidden bg-white text-right w-full"
      style={{
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
        <img
          src={item.img}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.tag && (
          <span
            className="absolute top-2.5 end-2.5 text-[10px] font-bold px-2 py-1 rounded-full text-white"
            style={{
              background:
                item.tag === "جديد" ? "var(--sage-deep)" : "var(--rose-deep)",
            }}
          >
            {item.tag}
          </span>
        )}
      </div>
      <div className="p-3.5 pb-4">
        <div
          className="font-marcellus text-[9px] tracking-[0.14em]"
          style={{ color: "var(--gold)" }}
        >
          ESIA
        </div>
        <div
          className="text-sm font-semibold mt-0.5"
          style={{ color: "var(--plum)" }}
        >
          {item.name}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--gray)" }}>
          {item.sub}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {item.colors.map((c, ci) => (
            <span
              key={ci}
              className="w-3 h-3 rounded-full"
              style={{ background: c.hex, boxShadow: "0 0 0 1px var(--line)" }}
            />
          ))}
        </div>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--rose-deep)" }}
          >
            {item.price.toLocaleString()} ج.م
          </span>
          {item.originalPrice && (
            <span
              className="text-xs line-through"
              style={{ color: "var(--gray)" }}
            >
              {item.originalPrice.toLocaleString()} ج.م
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function IconBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className="w-9 h-9 inline-flex items-center justify-center rounded-xl"
      style={{ color: "var(--plum-soft)" }}
    >
      <svg className="w-5 h-5">{children}</svg>
    </span>
  );
}
