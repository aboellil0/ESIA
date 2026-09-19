import {
  CATEGORIES,
  productsByCategory,
  type CategoryKey,
} from "../data/catalog";
import { ProductCard, SiteChrome } from "./SiteChrome";

const HERO_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f7efe6"/>
          <stop offset="100%" stop-color="#ede0d4"/>
        </linearGradient>
        <linearGradient id="pink" x1="0" x2="1">
          <stop offset="0%" stop-color="#f7d0d8"/>
          <stop offset="100%" stop-color="#d68aa0"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" x2="1">
          <stop offset="0%" stop-color="#f6e8c8"/>
          <stop offset="100%" stop-color="#d9b76d"/>
        </linearGradient>
      </defs>
      <rect width="1400" height="900" fill="url(#bg)"/>
      <g transform="translate(70 40)">
        <g transform="translate(110 0)">
          <path d="M320,96 C390,14 520,20 562,98 C610,80 644,90 658,120 C676,165 646,218 593,240 C615,306 592,365 520,390 C482,405 468,454 468,500 C468,560 450,620 378,656 C314,630 290,563 290,505 C290,465 284,410 245,385 C178,336 160,253 194,206 C218,176 231,155 258,118 C273,98 292,97 320,96 Z" fill="rgba(255,255,255,0.12)"/>
          <path d="M200 170 C 260 70, 420 40, 520 90 C 625 140, 720 150, 810 100 C 770 220, 730 260, 640 288 C 600 300, 552 315, 520 348 C 460 318, 390 304, 332 290 C 270 276, 230 254, 200 170 Z" fill="rgba(255,255,255,0.14)"/>
        </g>
        <g transform="translate(350 80)">
          <path d="M170 0 C 260 -25, 322 35, 322 92 C 368 70, 454 82, 470 130 C 500 125, 528 132, 540 160 C 554 192, 548 228, 525 232 C 548 262, 542 300, 490 312 C 466 330, 474 382, 438 392 C 392 404, 360 370, 318 370 C 284 420, 215 426, 160 394 C 120 368, 112 328, 125 300 C 92 292, 72 256, 74 214 C 76 170, 98 138, 142 120 C 120 82, 138 44, 170 0 Z" fill="url(#pink)" opacity="0.95"/>
          <path d="M180 40 C 230 15, 298 18, 340 60" stroke="#d89aa7" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M126 240 C 200 162, 238 150, 298 198" stroke="#d89aa7" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M338 224 C 396 210, 454 226, 490 276" stroke="#d89aa7" stroke-width="10" fill="none" stroke-linecap="round"/>
        </g>
        <g transform="translate(0 70)">
          <path d="M60 300 C 130 220, 228 182, 308 188 C 263 260, 258 332, 196 380 C 152 410, 92 420, 60 402 C 26 379, 28 332, 60 300 Z" fill="#e8b2bb" opacity="0.9"/>
          <path d="M638 300 C 710 220, 820 190, 888 202 C 853 270, 840 334, 780 380 C 742 408, 678 420, 638 404 C 600 382, 598 336, 638 300 Z" fill="#e8b2bb" opacity="0.9"/>
          <path d="M120 470 C 190 450, 260 450, 320 490" stroke="#d196a6" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M620 470 C 690 450, 760 450, 820 490" stroke="#d196a6" stroke-width="10" fill="none" stroke-linecap="round"/>
        </g>
        <g transform="translate(290 130)">
          <text x="0" y="260" text-anchor="middle" font-size="260" font-family="Georgia, 'Times New Roman', serif" font-weight="700" fill="#e7a7b8" stroke="#d496a2" stroke-width="3" letter-spacing="2">ESIA</text>
        </g>
        <g transform="translate(200 700)" fill="none" stroke="url(#gold)" stroke-width="11" stroke-linecap="round">
          <path d="M0 0 C 120 -30, 180 -30, 290 0"/>
          <path d="M420 0 C 540 -30, 600 -30, 720 0"/>
        </g>
        <g transform="translate(225 550)">
          <g fill="#d5b163" stroke="#c39445" stroke-width="3">
            <circle cx="40" cy="50" r="18"/>
            <circle cx="90" cy="30" r="16"/>
            <circle cx="140" cy="56" r="18"/>
            <circle cx="590" cy="52" r="18"/>
            <circle cx="638" cy="30" r="16"/>
            <circle cx="690" cy="56" r="18"/>
          </g>
          <g fill="#c9a7c9" opacity="0.9">
            <circle cx="104" cy="220" r="22"/>
            <circle cx="180" cy="198" r="18"/>
            <circle cx="514" cy="214" r="22"/>
            <circle cx="600" cy="196" r="18"/>
          </g>
          <g fill="#d8c18a" opacity="0.9">
            <circle cx="210" cy="286" r="16"/>
            <circle cx="513" cy="292" r="16"/>
          </g>
        </g>
      </g>
    </svg>
  `);
const STORY_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e7dfd9"/>
          <stop offset="100%" stop-color="#7d6d76"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)"/>
      <circle cx="930" cy="200" r="160" fill="rgba(255,255,255,0.12)"/>
      <circle cx="260" cy="750" r="230" fill="rgba(255,255,255,0.12)"/>
      <text x="50%" y="52%" text-anchor="middle" fill="#fff" font-size="70" font-family="Segoe UI, Arial, sans-serif" font-weight="700">قصتنا</text>
    </svg>
  `);

const PAGE_COPY: Record<
  string,
  { title: string; subtitle: string; category?: CategoryKey }
> = {
  home: {
    title: "استكشفي المنتجات",
    subtitle: "قطع مختارة لإطلالة ملكية في كل مناسبة",
  },
  dresses: {
    title: "مجموعة الفساتين",
    subtitle: "حرير، طبقات، وقصص تليق بالمساء",
    category: "dresses",
  },
  bags: {
    title: "الحقائب",
    subtitle: "كلاتشات نهارية ومسائية تكمل الإطلالة",
    category: "bags",
  },
  accessories: {
    title: "الإكسسوارات",
    subtitle: "تفاصيل ذهبية ولؤلؤ تكمل حضورك",
    category: "accessories",
  },
};

interface Props {
  view: string;
  onNavigate: (v: string, productId?: string) => void;
  cart: number;
  wishlist: boolean;
  onToggleWishlist: () => void;
}

export default function Storefront({
  view,
  onNavigate,
  cart,
  wishlist,
  onToggleWishlist,
}: Props) {
  if (view === "story") {
    return (
      <SiteChrome
        view={view}
        onNavigate={onNavigate}
        cart={cart}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
      >
        <section className="max-w-[1260px] mx-auto px-3 sm:px-6 py-8 sm:py-12 grid gap-6 sm:gap-10 lg:grid-cols-2 items-center">
          <div
            className="rounded-3xl overflow-hidden"
            style={{ minHeight: 320, border: "1px solid var(--line)" }}
          >
            <img
              src={STORY_IMG}
              alt="قصتنا"
              className="w-full h-full object-cover"
              style={{ minHeight: 320, objectPosition: "center" }}
            />
          </div>
          <div>
            <p
              className="text-xs font-bold tracking-[0.14em] uppercase mb-3"
              style={{ color: "var(--gold)" }}
            >
              HAUTE COUTURE
            </p>
            <h1
              className="font-marcellus text-4xl leading-tight mb-4"
              style={{ color: "var(--plum)" }}
            >
              قصتنا
            </h1>
            <p
              className="text-sm leading-8 mb-4"
              style={{ color: "var(--plum-soft)" }}
            >
              إيسيا وُلدت من حب التفاصيل الهادئة: الحرير، الذهب الخفيف، والورود
              التي لا تصرخ. نصمم قطعاً تمنح حضوراً ملكياً دون أن تفقد الدفء.
            </p>
            <p
              className="text-sm leading-8 mb-6"
              style={{ color: "var(--plum-soft)" }}
            >
              كل مجموعة تُختار بعناية لتكمل الأخرى — فستان، حقيبة، وإكسسوار في
              حوار واحد.
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
              تسوّقي المجموعة
            </button>
          </div>
        </section>
      </SiteChrome>
    );
  }

  const copy = PAGE_COPY[view] ?? PAGE_COPY.home;
  const products = productsByCategory(copy.category);

  return (
    <SiteChrome
      view={view}
      onNavigate={onNavigate}
      cart={cart}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
    >
      {view === "home" && (
        <section className="max-w-[1260px] mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-4">
          <div
            className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-3xl"
            style={{ border: "1px solid var(--line)", minHeight: 420 }}
          >
            <div className="relative min-h-[280px] md:min-h-[420px] lg:min-h-[560px] z-10">
              <img
                src="/logo.png"
                alt="إيسيا هوت كوتور"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center", zIndex: 10 }}
              />
            </div>
            <div
              className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-12 lg:px-14"
              style={{ background: "var(--ivory)" }}
            >
              <p
                className="text-xs font-bold tracking-[0.18em] uppercase mb-4"
                style={{ color: "var(--gold)" }}
              >
                ESIA HAUTE COUTURE
              </p>
              <h1
                className="font-marcellus text-4xl lg:text-5xl leading-tight mb-4"
                style={{ color: "var(--plum)" }}
              >
                إطلالة ملكية
                <br />
                بتفاصيل هادئة
              </h1>
              <p
                className="text-sm leading-8 mb-8 max-w-md"
                style={{ color: "var(--plum-soft)" }}
              >
                مجموعة روجينا تجمع الحرير الوردي مع الذهب الخفيف. صُممت لتمنحك
                حضوراً ناعماً في السهرات والمناسبات الخاصة.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("explore")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--rose), var(--rose-deep))",
                  }}
                >
                  استكشفي المنتجات
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("product", "rogeena")}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-white"
                  style={{
                    border: "1px solid var(--line)",
                    color: "var(--plum)",
                  }}
                >
                  فستان روجينا
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view !== "home" && (
        <section className="max-w-[1260px] mx-auto px-3 sm:px-6 pt-8 sm:pt-10">
          <p className="text-xs mb-2">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="bg-transparent border-none p-0 text-xs"
              style={{ color: "var(--rose-deep)" }}
            >
              الرئيسية
            </button>
            <span style={{ color: "var(--gray)" }}> / {copy.title}</span>
          </p>
        </section>
      )}

      <section
        id="explore"
        className="max-w-[1260px] mx-auto px-3 sm:px-6 py-8 sm:py-12 w-full"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2
              className="font-marcellus text-3xl mb-2"
              style={{ color: "var(--plum)" }}
            >
              {copy.title}
            </h2>
            <p className="text-sm" style={{ color: "var(--plum-soft)" }}>
              {copy.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={!copy.category} onClick={() => onNavigate("home")}>
              الكل
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                active={copy.category === c.key}
                onClick={() => onNavigate(c.view)}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onOpen={(id) => onNavigate("product", id)}
            />
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}

function Chip({
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
      className="px-4 py-2 rounded-full text-xs font-semibold"
      style={
        active
          ? {
              background: "var(--rose-deep)",
              color: "#fff",
              border: "1px solid var(--rose-deep)",
            }
          : {
              background: "#fff",
              color: "var(--plum-soft)",
              border: "1px solid var(--line)",
            }
      }
    >
      {children}
    </button>
  );
}
