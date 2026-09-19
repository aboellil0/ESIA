import { useEffect, useState } from "react";
import { getProduct, PRODUCTS } from "../data/catalog";
import { ProductCard, SiteChrome } from "./SiteChrome";

interface Props {
  productId: string;
  onNavigate: (v: string, productId?: string) => void;
  cart: number;
  onAddToCart: (item: {
    productId: string;
    name: string;
    price: number;
    size: string;
    color: string;
    image: string;
    qty: number;
  }) => void;
  wishlist: boolean;
  onToggleWishlist: () => void;
}

export default function ProductDetail({
  productId,
  onNavigate,
  cart,
  onAddToCart,
  wishlist,
  onToggleWishlist,
}: Props) {
  const product = getProduct(productId);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const activeColor = product.colors[selectedColor] ?? product.colors[0];
  const galleryThumbs = activeColor?.thumbs?.length
    ? activeColor.thumbs
    : product.thumbs.length
      ? product.thumbs
      : [product.img];
  const galleryImage = activeColor?.img ?? product.img;
  const unavailableSizes = new Set(
    (product.unavailableSizes ?? []).map(String),
  );
  const availableSizes = product.sizes.filter(
    (size) => !unavailableSizes.has(size),
  );
  const [selectedSize, setSelectedSize] = useState(
    availableSizes[Math.min(2, availableSizes.length - 1)] ?? product.sizes[0],
  );

  useEffect(() => {
    setActiveThumb(0);
  }, [selectedColor, product.id]);

  useEffect(() => {
    if (!availableSizes.length) return;

    if (!availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);
  const [qty, setQty] = useState(1);
  const [accordion, setAccordion] = useState<Record<string, boolean>>({});
  const [added, setAdded] = useState(false);

  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const toggleAccordion = (key: string) =>
    setAccordion((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleAddToCart = () => {
    if (unavailableSizes.has(selectedSize)) return;

    onAddToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: activeColor?.label ?? "أساسي",
      image: galleryImage,
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <SiteChrome
      view="product"
      onNavigate={onNavigate}
      cart={cart}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
    >
      <div
        className="max-w-[1260px] mx-auto px-6 pt-6 w-full text-sm"
        style={{ color: "var(--plum-soft)" }}
      >
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="bg-transparent border-none p-0"
          style={{ color: "var(--rose-deep)" }}
        >
          الرئيسية
        </button>
        {" / "}
        <button
          type="button"
          onClick={() => onNavigate(product.category)}
          className="bg-transparent border-none p-0"
          style={{ color: "var(--rose-deep)" }}
        >
          {product.category === "dresses"
            ? "الفساتين"
            : product.category === "bags"
              ? "الحقائب"
              : "الإكسسوارات"}
        </button>
        {" / "}
        <span style={{ color: "var(--plum)" }}>{product.name}</span>
      </div>

      <div className="max-w-[1260px] mx-auto px-6 py-10 w-full">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          <div className="flex gap-3" style={{ direction: "ltr" }}>
            <div className="flex flex-col gap-2.5">
              {galleryThumbs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  className="rounded-xl overflow-hidden flex-none transition-all"
                  style={{
                    width: 72,
                    height: 90,
                    border:
                      activeThumb === i
                        ? "2px solid var(--rose-deep)"
                        : "1.5px solid var(--line)",
                  }}
                >
                  <img src={t} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div
              className="flex-1 rounded-2xl overflow-hidden"
              style={{ aspectRatio: "3/4", border: "1px solid var(--line)" }}
            >
              <img
                src={galleryThumbs[activeThumb] ?? galleryImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="pt-4">
            <div
              className="text-xs font-bold tracking-[0.14em] uppercase mb-2"
              style={{ color: "var(--gold)" }}
            >
              ESIA COUTURE
            </div>
            <h1
              className="font-marcellus text-4xl leading-tight mb-1"
              style={{ color: "var(--plum)" }}
            >
              {product.name}
            </h1>
            <p
              className="dir-ltr text-sm mb-4"
              style={{ color: "var(--plum-soft)" }}
            >
              {product.sub}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-[28px] font-bold"
                style={{ color: "var(--rose-deep)" }}
              >
                {product.price.toLocaleString()} ج.م
              </span>
              {product.originalPrice && (
                <>
                  <span
                    className="text-base line-through"
                    style={{ color: "var(--gray)" }}
                  >
                    {product.originalPrice.toLocaleString()} ج.م
                  </span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--blush-soft)",
                      color: "var(--rose-deep)",
                    }}
                  >
                    وفري{" "}
                    {Math.round(
                      (1 - product.price / product.originalPrice) * 100,
                    )}
                    %
                  </span>
                </>
              )}
            </div>

            <div
              className="my-5"
              style={{ borderBottom: "1px solid var(--line)" }}
            />

            <div className="mb-5">
              <div
                className="text-sm font-semibold mb-2.5"
                style={{ color: "var(--plum)" }}
              >
                اللون:{" "}
                <span style={{ color: "var(--plum-soft)", fontWeight: 400 }}>
                  {activeColor?.label ?? "أساسي"}
                </span>
              </div>
              <div className="flex gap-2.5">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: 26,
                      height: 26,
                      background: c.hex,
                      outline:
                        selectedColor === i
                          ? `2px solid var(--rose-deep)`
                          : "2px solid transparent",
                      outlineOffset: 2,
                      boxShadow: "0 0 0 1px var(--line)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--plum)" }}
                >
                  المقاس
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((s) => {
                  const isUnavailable = unavailableSizes.has(s);

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => !isUnavailable && setSelectedSize(s)}
                      disabled={isUnavailable}
                      className="h-10 px-3.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed"
                      style={
                        isUnavailable
                          ? {
                              border: "1.3px dashed var(--line)",
                              background: "var(--ivory)",
                              color: "var(--gray)",
                              opacity: 0.55,
                            }
                          : selectedSize === s
                            ? {
                                border: "2px solid var(--rose-deep)",
                                background: "#fff",
                                color: "var(--rose-deep)",
                              }
                            : {
                                border: "1.3px solid var(--line)",
                                background: "#fff",
                                color: "var(--plum)",
                              }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 items-center mb-6">
              <div
                className="flex items-center gap-0 rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--line)" }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-12 text-xl font-light flex items-center justify-center border-none bg-transparent"
                  style={{
                    color: "var(--plum)",
                    borderInlineEnd: "1px solid var(--line)",
                  }}
                >
                  −
                </button>
                <span
                  className="w-10 h-12 flex items-center justify-center text-sm font-semibold"
                  style={{ color: "var(--plum)" }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-12 text-xl font-light flex items-center justify-center border-none bg-transparent"
                  style={{
                    color: "var(--plum)",
                    borderInlineStart: "1px solid var(--line)",
                  }}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all"
                style={{
                  background: added
                    ? "var(--sage-deep)"
                    : "linear-gradient(135deg, var(--rose), var(--rose-deep))",
                }}
              >
                {added ? "تمت الإضافة ✓" : "أضيفي للسلة"}
              </button>
            </div>

            {[
              {
                key: "fabric",
                label: "تفاصيل المنتج",
                content: product.fabric,
              },
              { key: "care", label: "تعليمات العناية", content: product.care },
            ].map(({ key, label, content }) => (
              <div key={key} style={{ borderTop: "1px solid var(--line)" }}>
                <button
                  onClick={() => toggleAccordion(key)}
                  className="w-full flex items-center justify-between py-4 bg-transparent border-none text-right"
                  style={{ color: "var(--plum)" }}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <svg
                    className="w-5 h-5 flex-none transition-transform"
                    style={{
                      transform: accordion[key] ? "rotate(45deg)" : "rotate(0)",
                      color: "var(--plum-soft)",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  >
                    <line x1={12} y1={5} x2={12} y2={19} />
                    <line x1={5} y1={12} x2={19} y2={12} />
                  </svg>
                </button>
                {accordion[key] && (
                  <div
                    className="pb-4 text-sm leading-relaxed"
                    style={{ color: "var(--plum-soft)" }}
                  >
                    {content}
                  </div>
                )}
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--line)" }} />
          </div>
        </div>
      </div>

      <div className="max-w-[1260px] mx-auto px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-7">
          <h2
            className="font-marcellus text-2xl"
            style={{ color: "var(--plum)" }}
          >
            أكملي مظهرك بقطع متناسقة
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="text-xs font-semibold bg-transparent border-none"
            style={{ color: "var(--rose-deep)" }}
          >
            كل المنتجات
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {related.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onOpen={(id) => onNavigate("product", id)}
            />
          ))}
        </div>
      </div>
    </SiteChrome>
  );
}
