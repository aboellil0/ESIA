export type CategoryKey = "dresses" | "bags" | "accessories";

export interface CatalogColor {
  label: string;
  hex: string;
  img?: string;
  thumbs?: string[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  sub: string;
  price: number;
  originalPrice: number | null;
  tag: string | null;
  category: CategoryKey;
  colors: CatalogColor[];
  sizes: string[];
  unavailableSizes?: string[];
  img: string;
  thumbs: string[];
  fabric: string;
  care: string;
}

const makeArt = (label: string, start: string, end: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}"/>
          <stop offset="100%" stop-color="${end}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#g)"/>
      <circle cx="650" cy="180" r="180" fill="rgba(255,255,255,0.14)"/>
      <circle cx="170" cy="780" r="220" fill="rgba(255,255,255,0.18)"/>
      <path d="M180 760C270 600 540 550 620 760V980H180V760Z" fill="rgba(255,255,255,0.12)"/>
      <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="2">ESIA</text>
      <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="500">${label}</text>
    </svg>
  `)}`;

export const CATEGORIES: { key: CategoryKey; label: string; view: string }[] = [
  { key: "dresses", label: "الفساتين", view: "dresses" },
  { key: "bags", label: "الحقائب", view: "bags" },
  { key: "accessories", label: "الإكسسوارات", view: "accessories" },
];

const PRODUCT_ASSETS = {
  product1: [
    "/assets/product1/WhatsApp Image 2026-08-30 at 10.42.07 AM (1).jpeg",
    "/assets/product1/WhatsApp Image 2026-08-30 at 10.42.08 AM (1).jpeg",
    "/assets/product1/WhatsApp Image 2026-08-30 at 10.42.08 AM.jpeg",
  ],
  product2: [
    "/assets/product 2/WhatsApp Image 2026-08-30 at 10.42.09 AM (1).jpeg",
    "/assets/product 2/WhatsApp Image 2026-08-30 at 10.42.09 AM.jpeg",
  ],
  product3: [
    "/assets/product 3/WhatsApp Image 2026-08-30 at 10.42.09 AM (2).jpeg",
    "/assets/product 3/WhatsApp Image 2026-08-30 at 10.42.09 AM (3).jpeg",
    "/assets/product 3/WhatsApp Image 2026-08-30 at 10.42.09 AM (4).jpeg",
  ],
  product4: [
    "/assets/product 4/WhatsApp Image 2026-08-30 at 10.42.08 AM (2).jpeg",
    "/assets/product 4/WhatsApp Image 2026-08-30 at 10.42.08 AM (3).jpeg",
  ],
  product5: ["/assets/product 5/WhatsApp Image 2026-08-30 at 10.42.07 AM.jpeg"],
} as const;

export const PRODUCTS: CatalogProduct[] = [
  {
    id: "rosalind-puff-dress",
    name: "Rosalind Puff Dress",
    sub: "Blush puff dress with soft tailoring",
    price: 760,
    originalPrice: 980,
    tag: "خصم",
    category: "dresses",
    colors: [
      {
        label: "وردي كلاسيكي",
        hex: "#C67B90",
        img: PRODUCT_ASSETS.product1[0],
        thumbs: PRODUCT_ASSETS.product1,
      },
      {
        label: "أسود",
        hex: "#22201E",
        img: PRODUCT_ASSETS.product1[1],
        thumbs: PRODUCT_ASSETS.product1,
      },
      {
        label: "عاجي",
        hex: "#F0E6DA",
        img: PRODUCT_ASSETS.product1[2],
        thumbs: PRODUCT_ASSETS.product1,
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    unavailableSizes: ["XL"],
    img: PRODUCT_ASSETS.product1[0],
    thumbs: PRODUCT_ASSETS.product1,
    fabric:
      "قماش حريري ناعم مع قصة كسرات منفوخة بخطوط أنيقة. مناسب للظهور اليومي والمناسبات الخفيفة.",
    care: "غسيل يدوي بماء بارد فقط. تُحفظ معلقة في مكان جاف بعيداً عن أشعة الشمس المباشرة.",
  },
  {
    id: "meadow-tiered-dress",
    name: "Meadow Tiered Dress",
    sub: "Layered dress with airy movement",
    price: 820,
    originalPrice: 980,
    tag: null,
    category: "dresses",
    colors: [
      {
        label: "كاكي",
        hex: "#7C7856",
        img: PRODUCT_ASSETS.product2[0],
        thumbs: PRODUCT_ASSETS.product2,
      },
      {
        label: "وردي",
        hex: "#C67B90",
        img: PRODUCT_ASSETS.product2[1],
        thumbs: PRODUCT_ASSETS.product2,
      },
    ],
    sizes: ["XS", "S", "M", "L"],
    img: PRODUCT_ASSETS.product2[0],
    thumbs: PRODUCT_ASSETS.product2,
    fabric:
      "شيفون طبقي خفيف مع خصر ناعم وقصة مرنة تمنح الحركة والراحة أثناء ارتداء اليوم الكامل.",
    care: "غسيل يدوي بارد وتعليقها في الظل حتى تجف ببطء للحفاظ على القماش.",
  },
  {
    id: "aria-bow-suit",
    name: "Aria Bow Suit",
    sub: "Soft structured suit with bow finish",
    price: 860,
    originalPrice: 1200,
    tag: "جديد",
    category: "dresses",
    colors: [
      {
        label: "عاجي",
        hex: "#F0E6DA",
        img: PRODUCT_ASSETS.product3[0],
        thumbs: PRODUCT_ASSETS.product3,
      },
      {
        label: "أسود",
        hex: "#22201E",
        img: PRODUCT_ASSETS.product3[1],
        thumbs: PRODUCT_ASSETS.product3,
      },
    ],
    sizes: ["S", "M", "L"],
    img: PRODUCT_ASSETS.product3[0],
    thumbs: PRODUCT_ASSETS.product3,
    fabric:
      "قماش خفيف منسوج بدقة مع تفاصيل فيونكة أنيقة وقصة منتظمة تناسب الظهور الرسمي والعصري.",
    care: "تنظيف جاف موصى به مع تعليقها بدقة للحفاظ على شكل القصة والتفاصيل.",
  },
  {
    id: "elara-structured-abaya",
    name: "Elara Structured Abaya",
    sub: "Minimal abaya with structured lines",
    price: 940,
    originalPrice: null,
    tag: "جديد",
    category: "dresses",
    colors: [
      {
        label: "أسود",
        hex: "#22201E",
        img: PRODUCT_ASSETS.product4[0],
        thumbs: PRODUCT_ASSETS.product4,
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    img: PRODUCT_ASSETS.product4[0],
    thumbs: PRODUCT_ASSETS.product4,
    fabric:
      "قماش كريب فاخر بقصة منظمة وخطوط ناعمة. تصميم أنيق ومريح للاستخدام اليومي والمناسبات.",
    care: "تنظيف جاف موصى به، مع تعليق المنتج بعد الاستخدام للحفاظ على القصة والملمس.",
  },
  {
    id: "noor-maxi-dress",
    name: "Noor Maxi Dress",
    sub: "Long maxi dress with elegant drape",
    price: 720,
    originalPrice: 960,
    tag: "خصم",
    category: "dresses",
    colors: [
      {
        label: "وردي",
        hex: "#C67B90",
        img: PRODUCT_ASSETS.product5[0],
        thumbs: PRODUCT_ASSETS.product5,
      },
      {
        label: "عاجي",
        hex: "#F0E6DA",
        img: PRODUCT_ASSETS.product5[0],
        thumbs: PRODUCT_ASSETS.product5,
      },
      {
        label: "أحمر داكن",
        hex: "#7B2D3A",
        img: PRODUCT_ASSETS.product5[0],
        thumbs: PRODUCT_ASSETS.product5,
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    img: PRODUCT_ASSETS.product5[0],
    thumbs: PRODUCT_ASSETS.product5,
    fabric:
      "قطعة طويلة متدلية بقماش ناعم ومريح مع تشطيب فاخر يبرز الطول والأناقة في كل حركة.",
    care: "غسيل يدوي بارد مع تجفيف منتظم في الظل للحفاظ على جودة القماش واللون.",
  },
];

export function getProduct(id: string | null) {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
}

export function addProductToCatalog(product: CatalogProduct) {
  const exists = PRODUCTS.some((p) => p.id === product.id);
  if (!exists) {
    PRODUCTS.unshift(product);
  }
}

export function updateProductInCatalog(product: CatalogProduct) {
  const index = PRODUCTS.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    PRODUCTS[index] = product;
    return;
  }

  PRODUCTS.unshift(product);
}

export function removeProductFromCatalog(id: string) {
  const index = PRODUCTS.findIndex((p) => p.id === id);
  if (index >= 0) {
    PRODUCTS.splice(index, 1);
  }
}

export function productsByCategory(category?: CategoryKey) {
  if (!category) return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === category);
}
