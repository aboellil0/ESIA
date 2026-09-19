import { useState, useRef, useCallback } from "react";
import {
  PRODUCTS,
  addProductToCatalog,
  removeProductFromCatalog,
  updateProductInCatalog,
  type CatalogProduct,
  type CategoryKey,
} from "../data/catalog";

/* ── silhouette SVG paths ── */
const SHAPES_PATHS: Record<string, (c: string) => string> = {
  puff: (c) =>
    `<path d="M50 8c-9 0-14 6-14 12 0 4 2 7 5 9-16 6-24 12-24 26 0 5 3 9 7 9h52c4 0 7-4 7-9 0-14-8-20-24-26 3-2 5-5 5-9 0-6-5-12-14-12Z" fill="${c}" opacity="0.9"/><path d="M17 55c-10 8-14 20-14 34h20c1-12 4-22 9-30" fill="${c}" opacity="0.65"/><path d="M83 55c10 8 14 20 14 34H77c-1-12-4-22-9-30" fill="${c}" opacity="0.65"/><path d="M28 100l-6 55h56l-6-55c-10 8-34 8-44 0Z" fill="${c}"/>`,
  tiered: (c) =>
    `<path d="M50 8c-9 0-15 6-15 13 0 21-2 30-2 30h34s-2-9-2-30c0-7-6-13-15-13Z" fill="${c}"/><path d="M33 51c-4 14-6 22-6 28h46c0-6-2-14-6-28Z" fill="${c}" opacity="0.85"/><path d="M27 79c-5 12-9 24-9 34h64c0-10-4-22-9-34Z" fill="${c}" opacity="0.7"/><path d="M18 113c-6 14-10 26-10 42h84c0-16-4-28-10-42Z" fill="${c}" opacity="0.55"/>`,
  bow: (c) =>
    `<path d="M50 8c-8 0-13 6-13 12 0 5 2 8 6 10l-2 8h18l-2-8c4-2 6-5 6-10 0-6-5-12-13-12Z" fill="${c}"/><path d="M25 38c-4 14-6 30-6 46h62c0-16-2-32-6-46-8 6-42 6-50 0Z" fill="${c}" opacity="0.85"/><path d="M40 40l-8 10 8 4 10-6-2-8Z" fill="${c}"/><path d="M60 40l8 10-8 4-10-6 2-8Z" fill="${c}"/><circle cx="50" cy="46" r="4" fill="${c}"/>`,
  maxi: (c) =>
    `<path d="M50 6c-10 0-16 6-16 13 0 5 3 8 7 10-3 5-5 10-5 16 0 30-4 60-4 110h36c0-50-4-80-4-110 0-6-2-11-5-16 4-2 7-5 7-10 0-7-6-13-16-13Z" fill="${c}"/>`,
  abaya: (c) =>
    `<path d="M50 10c-8 0-13 6-13 12 0 4 2 7 5 9-18 5-28 16-28 34 0 40 2 70 2 90h68c0-20 2-50 2-90 0-18-10-29-28-34 3-2 5-5 5-9 0-6-5-12-13-12Z" fill="${c}"/>`,
  twirl: (c) =>
    `<path d="M50 8c-8 0-13 6-13 12 0 5 3 8 7 10-14 4-20 12-20 22 0 8 4 12 10 12h32c6 0 10-4 10-12 0-10-6-18-20-22 4-2 7-5 7-10 0-6-5-12-13-12Z" fill="${c}"/><path d="M22 64c-14 18-18 40-10 62l20-6c-6-16-4-32 4-46Z" fill="${c}" opacity="0.75"/><path d="M78 64c14 18 18 40 10 62l-20-6c6-16 4-32-4-46Z" fill="${c}" opacity="0.75"/>`,
};

const SHAPE_LIST = [
  { key: "puff", label: "أكمام منفوخة" },
  { key: "tiered", label: "طبقات" },
  { key: "bow", label: "فيونكة" },
  { key: "maxi", label: "طويل" },
  { key: "abaya", label: "عباية" },
  { key: "twirl", label: "دوّار" },
];

const SIZES = ["S", "M", "L", "XL"];

function SilhouetteSVG({
  shape,
  color,
  className,
}: {
  shape: string;
  color: string;
  className?: string;
}) {
  const fn = SHAPES_PATHS[shape] ?? SHAPES_PATHS.puff;
  return (
    <svg
      className={className}
      viewBox="0 0 100 180"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: fn(color) }}
    />
  );
}

const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f7dfe7"/>
          <stop offset="100%" stop-color="#b66a84"/>
        </linearGradient>
      </defs>
      <rect width="900" height="1200" fill="url(#g)"/>
      <circle cx="650" cy="200" r="160" fill="rgba(255,255,255,0.14)"/>
      <circle cx="200" cy="980" r="240" fill="rgba(255,255,255,0.12)"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#fff" font-size="48" font-family="Segoe UI, Arial, sans-serif" font-weight="700">ESIA</text>
      <text x="50%" y="60%" text-anchor="middle" fill="#fff" font-size="34" font-family="Segoe UI, Arial, sans-serif">منتج جديد</text>
    </svg>
  `);

const toProductId = (name: string) => {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-product";

  return `${base}-${Date.now()}`;
};

export default function AdminProducts({
  onNavigate,
}: {
  onNavigate: (v: string) => void;
}) {
  /* form state */
  const [name, setName] = useState("");
  const [category, setCategory] = useState("دresses");
  const [tag, setTag] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [colors, setColors] = useState(["#C67B90"]);
  const [colorPicker, setColorPicker] = useState("#C67B90");
  const [sizes, setSizes] = useState<string[]>([...SIZES]);
  const [unavailableSizes, setUnavailableSizes] = useState<string[]>([]);
  const [shape, setShape] = useState("puff");
  const [desc, setDesc] = useState("");
  const [uploadedImage, setUploadedImage] = useState<{
    dataUrl: string;
    name: string;
  } | null>(null);
  const [extraImages, setExtraImages] = useState<
    {
      dataUrl: string;
      name: string;
    }[]
  >([]);
  const [dragging, setDragging] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<CatalogProduct[]>(() => [
    ...PRODUCTS,
  ]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) =>
      setUploadedImage({
        dataUrl: e.target!.result as string,
        name: file.name,
      });
    reader.readAsDataURL(file);
  }, []);

  const handleExtraFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!imageFiles.length) return;

    const nextImages = imageFiles.map((file) => {
      const reader = new FileReader();
      const result = new Promise<{ dataUrl: string; name: string }>(
        (resolve) => {
          reader.onload = (e) =>
            resolve({
              dataUrl: e.target!.result as string,
              name: file.name,
            });
          reader.readAsDataURL(file);
        },
      );
      return result;
    });

    Promise.all(nextImages).then((images) => {
      setExtraImages((prev) => [...prev, ...images]);
    });
  }, []);

  const discount = (() => {
    const p = parseFloat(price);
    const o = parseFloat(originalPrice);
    if (o && p && o > p) return Math.round((1 - p / o) * 100);
    return null;
  })();

  const toggleSize = (s: string) => {
    setUnavailableSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setSizes((prev) => (prev.includes(s) ? prev : [...prev, s]));
  };

  const addColor = () => {
    if (!colors.includes(colorPicker))
      setColors((prev) => [...prev, colorPicker]);
  };
  const removeColor = (i: number) =>
    setColors((prev) => prev.filter((_, idx) => idx !== i));

  const startEditProduct = (product: CatalogProduct) => {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setTag(
      product.tag === "جديد"
        ? "new"
        : product.tag === "الأكثر مبيعاً"
          ? "best"
          : "",
    );
    setPrice(String(product.price));
    setOriginalPrice(
      product.originalPrice ? String(product.originalPrice) : "",
    );
    setColors(product.colors.map((c) => c.hex));
    setSizes(product.sizes.length ? product.sizes : [...SIZES]);
    setUnavailableSizes(product.unavailableSizes ?? []);
    setDesc(product.fabric || product.sub || "");
    setUploadedImage(
      product.img
        ? {
            dataUrl: product.img,
            name: product.name,
          }
        : null,
    );
    setExtraImages(
      (product.thumbs ?? []).slice(1).map((img, idx) => ({
        dataUrl: img,
        name: `${product.name}-extra-${idx + 1}`,
      })),
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const publish = () => {
    if (!name.trim() || !price) {
      alert("من فضلك أدخلي اسم المنتج والسعر");
      return;
    }

    const p = parseFloat(price);
    const o = parseFloat(originalPrice) || null;
    const normalizedCategory = category as CategoryKey;
    const catalogColors = colors.map((hex, index) => ({
      label: index === 0 ? "اللون الأساسي" : `لون ${index + 1}`,
      hex,
    }));
    const allUploadedImages = [
      ...(uploadedImage ? [uploadedImage.dataUrl] : []),
      ...extraImages.map((image) => image.dataUrl),
    ];
    const catalogImage = allUploadedImages[0] ?? FALLBACK_PRODUCT_IMAGE;
    const catalogThumbs = allUploadedImages.length
      ? allUploadedImages
      : [FALLBACK_PRODUCT_IMAGE];
    const productTag =
      tag === "new"
        ? "جديد"
        : tag === "best"
          ? "الأكثر مبيعاً"
          : o
            ? `خصم ${Math.round((1 - p / o) * 100)}%`
            : null;

    const newProduct: CatalogProduct = {
      id: editingProductId ?? toProductId(name),
      name: name.trim(),
      sub: desc.trim() || "مجموعة جديدة من إيسيا",
      price: p,
      originalPrice: o,
      tag: productTag,
      category: normalizedCategory,
      colors: catalogColors,
      sizes: sizes.length ? sizes : [...SIZES],
      unavailableSizes: unavailableSizes,
      img: catalogImage,
      thumbs: catalogThumbs,
      fabric:
        desc.trim() ||
        "قماش فاخر مع تفاصيل أنيقة ومناسبة للاستخدام اليومي والمناسبات الخاصة.",
      care: "تنظيف خفيف مع العناية المناسبة للحفاظ على الجودة واللون.",
    };

    if (editingProductId) {
      updateProductInCatalog(newProduct);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingProductId ? newProduct : product,
        ),
      );
    } else {
      addProductToCatalog(newProduct);
      setProducts((prev) => [newProduct, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setOriginalPrice("");
    setDesc("");
    setTag("");
    setColors(["#C67B90"]);
    setSizes([...SIZES]);
    setUnavailableSizes([]);
    setShape("puff");
    setUploadedImage(null);
    setExtraImages([]);
    setEditingProductId(null);
  };

  const deleteProduct = (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    removeProductFromCatalog(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const categoryOptions = [
    { value: "dresses", label: "فساتين" },
    { value: "bags", label: "حقائب" },
    { value: "accessories", label: "إكسسوارات" },
  ] as const;

  return (
    <div className="min-h-full" style={{ background: "var(--ivory)" }}>
      {/* Topbar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white"
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
              background: "#fff",
              borderColor: "var(--line)",
              color: "var(--plum-soft)",
            }}
          >
            الطلبات
          </button>
          <button
            onClick={() => onNavigate("admin-products")}
            className="px-4 py-2 rounded-full text-xs font-semibold border"
            style={{
              background: "var(--rose-deep)",
              borderColor: "var(--rose-deep)",
              color: "#fff",
            }}
          >
            المنتجات
          </button>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-5 py-7 pb-16">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 0.9fr",
            alignItems: "start",
            gap: 22,
          }}
        >
          {/* ── FORM PANEL ── */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid var(--line)" }}
          >
            <h2
              className="font-marcellus text-base mb-1"
              style={{ color: "var(--plum)", margin: 0 }}
            >
              إضافة منتج جديد
            </h2>
            <p
              className="text-xs mb-5 mt-1"
              style={{ color: "var(--plum-soft)" }}
            >
              هتظهر التغييرات في المعاينة جنبك أول بأول
            </p>

            {/* Name */}
            <Field label="اسم المنتج">
              <input
                type="text"
                className="w-full dir-ltr rounded-[10px] px-3 py-2.5 text-sm outline-none"
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--ivory)",
                  color: "var(--plum)",
                }}
                placeholder="Rosalind Puff Dress"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            {/* Category + Tag */}
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="التصنيف">
                <select
                  className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--ivory)",
                    color: "var(--plum)",
                  }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="الوسم">
                <div className="flex gap-2 flex-wrap">
                  {[
                    { v: "", l: "بدون" },
                    { v: "new", l: "جديد" },
                    { v: "best", l: "الأكثر مبيعاً" },
                  ].map(({ v, l }) => (
                    <label key={v} className="relative cursor-pointer">
                      <input
                        type="radio"
                        className="absolute opacity-0 w-0 h-0"
                        name="tag"
                        value={v}
                        checked={tag === v}
                        onChange={() => setTag(v)}
                      />
                      <span
                        className="inline-block px-3.5 py-2 rounded-full text-[12.5px] font-semibold border transition-all"
                        style={
                          tag === v
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
                        {l}
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            {/* Image upload */}
            <Field label="صورة المنتج">
              {uploadedImage ? (
                <div className="flex items-start gap-3">
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid var(--line)",
                      aspectRatio: "3/4",
                      width: 110,
                    }}
                  >
                    <img
                      src={uploadedImage.dataUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border-none"
                      style={{ background: "rgba(56,37,48,0.75)" }}
                    >
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <line x1={6} y1={6} x2={18} y2={18} />
                        <line x1={18} y1={6} x2={6} y2={18} />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <div
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--sage-deep)" }}
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.4}
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {uploadedImage.name}
                    </div>
                    <button
                      className="text-xs font-bold border rounded-lg px-3 py-1.5"
                      style={{
                        borderColor: "var(--line)",
                        color: "var(--rose-deep)",
                        background: "#fff",
                      }}
                      onClick={() => fileRef.current?.click()}
                    >
                      استبدال الصورة
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && handleFile(e.target.files[0])
                      }
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all"
                  style={{
                    border: `1.6px dashed ${dragging ? "var(--rose-deep)" : "var(--line)"}`,
                    background: dragging ? "var(--blush-soft)" : "var(--ivory)",
                  }}
                  onClick={() => fileRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (e.dataTransfer.files[0])
                      handleFile(e.dataTransfer.files[0]);
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    style={{ color: "var(--rose-deep)" }}
                  >
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                  </svg>
                  <div
                    className="text-[12.5px]"
                    style={{ color: "var(--plum-soft)" }}
                  >
                    <strong style={{ color: "var(--rose-deep)" }}>
                      اضغطي لرفع صورة
                    </strong>{" "}
                    أو اسحبيها هنا
                  </div>
                  <div
                    className="text-[10.5px]"
                    style={{ color: "var(--gray)" }}
                  >
                    JPG أو PNG — يُفضّل مقاس 3:4
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </div>
              )}
            </Field>

            {/* Extra photos */}
            <Field label="صور إضافية للمنتج">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2.5">
                  {extraImages.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative rounded-xl overflow-hidden"
                      style={{
                        border: "1px solid var(--line)",
                        aspectRatio: "3/4",
                        width: 90,
                      }}
                    >
                      <img
                        src={image.dataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtraImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border-none"
                        style={{ background: "rgba(56,37,48,0.75)" }}
                      >
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <line x1={6} y1={6} x2={18} y2={18} />
                          <line x1={18} y1={6} x2={6} y2={18} />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="text-xs font-bold border rounded-lg px-3 py-1.5"
                  style={{
                    borderColor: "var(--line)",
                    color: "var(--rose-deep)",
                    background: "#fff",
                  }}
                  onClick={() => extraFileRef.current?.click()}
                >
                  + أضف صورة ثانية
                </button>
                <input
                  ref={extraFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleExtraFiles(e.target.files)
                  }
                />
              </div>
            </Field>

            {/* Shape */}
            <Field label="الشكل الافتراضي (يُستخدم فقط لو مفيش صورة مرفوعة)">
              <div className="grid grid-cols-3 gap-2.5">
                {SHAPE_LIST.map((s) => (
                  <label key={s.key} className="cursor-pointer">
                    <input
                      type="radio"
                      name="shape"
                      value={s.key}
                      checked={shape === s.key}
                      onChange={() => setShape(s.key)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <div
                      className="flex flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-xl transition-all"
                      style={
                        shape === s.key
                          ? {
                              border: "1.3px solid var(--rose-deep)",
                              background: "var(--blush-soft)",
                              boxShadow: "0 0 0 1px var(--rose-deep) inset",
                            }
                          : {
                              border: "1.3px solid var(--line)",
                              background: "var(--ivory)",
                            }
                      }
                    >
                      <SilhouetteSVG
                        shape={s.key}
                        color="#9A4F63"
                        className="w-[30px] h-[52px]"
                      />
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--plum-soft)" }}
                      >
                        {s.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            {/* Price */}
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="السعر الحالي (ج.م)">
                <input
                  type="number"
                  className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--ivory)",
                    color: "var(--plum)",
                  }}
                  placeholder="700"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
              <Field label="السعر قبل الخصم (اختياري)">
                <input
                  type="number"
                  className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--ivory)",
                    color: "var(--plum)",
                  }}
                  placeholder="1120"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
                {discount && (
                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-bold mt-2 px-3 py-1.5 rounded-full"
                    style={{ background: "#F4E1E1", color: "var(--red)" }}
                  >
                    خصم {discount}%
                  </div>
                )}
              </Field>
            </div>

            {/* Colors */}
            <Field label="الألوان المتاحة">
              <div className="flex flex-wrap gap-2.5 items-center">
                {colors.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                    style={{
                      background: "var(--ivory-deep)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span
                      className="w-[18px] h-[18px] rounded-full border-2 border-white"
                      style={{
                        background: c,
                        boxShadow: "0 0 0 1px var(--line)",
                      }}
                    />
                    <span className="dir-ltr">{c}</span>
                    {colors.length > 1 && (
                      <button
                        onClick={() => removeColor(i)}
                        className="bg-transparent border-none text-sm leading-none px-0.5"
                        style={{ color: "var(--gray)" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <input
                  type="color"
                  value={colorPicker}
                  onChange={(e) => setColorPicker(e.target.value)}
                  className="w-9 h-9 rounded-full border-none p-0 cursor-pointer bg-transparent"
                />
                <button
                  onClick={addColor}
                  className="rounded-full px-3.5 py-1.5 text-xs font-bold bg-transparent"
                  style={{
                    border: "1.3px dashed var(--line)",
                    color: "var(--rose-deep)",
                  }}
                >
                  + إضافة لون
                </button>
              </div>
            </Field>

            {/* Sizes */}
            <Field label="المقاسات (المرئية وغير المتاحة)">
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((s) => {
                  const isUnavailable = unavailableSizes.includes(s);

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className="h-10 px-3.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed"
                      style={
                        isUnavailable
                          ? {
                              border: "1.3px dashed var(--line)",
                              background: "var(--ivory)",
                              color: "var(--gray)",
                              opacity: 0.6,
                            }
                          : {
                              background: "var(--rose-deep)",
                              borderColor: "var(--rose-deep)",
                              color: "#fff",
                              border: "1.3px solid var(--rose-deep)",
                            }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Description */}
            <Field label="وصف مختصر (اختياري)">
              <textarea
                className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none resize-y min-h-[70px]"
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--ivory)",
                  color: "var(--plum)",
                }}
                placeholder="تفاصيل القماش، المقاس المثالي، تعليمات العناية..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </Field>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={publish}
                className="flex-1 py-3.5 rounded-xl border-none text-[14.5px] font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--rose), var(--rose-deep))",
                  boxShadow: "var(--shadow)",
                }}
              >
                {editingProductId ? "حفظ التعديلات" : "نشر المنتج"}
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-3.5 rounded-xl text-[13.5px] font-semibold bg-white"
                style={{
                  border: "1.3px solid var(--line)",
                  color: "var(--plum-soft)",
                }}
              >
                {editingProductId ? "إلغاء" : "مسح الحقول"}
              </button>
            </div>
          </div>

          {/* ── LIVE PREVIEW ── */}
          <div className="sticky top-[90px]">
            <div
              className="text-center text-xs font-bold mb-2.5 uppercase tracking-[0.08em]"
              style={{ color: "var(--gold)" }}
            >
              شكل الكارت في المتجر
            </div>
            <div
              className="rounded-[18px] overflow-hidden mx-auto"
              style={{
                background: "#fff",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
                maxWidth: 230,
              }}
            >
              <div
                className="relative"
                style={{
                  aspectRatio: "3/4",
                  background:
                    "linear-gradient(165deg, var(--ivory-deep), var(--blush-soft))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage.dataUrl}
                    alt=""
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <SilhouetteSVG
                    shape={shape}
                    color={colors[0] ?? "#C67B90"}
                    className="w-[64%] h-[82%]"
                  />
                )}
                {tag && (
                  <span
                    className="absolute top-2.5 end-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                    style={{
                      background:
                        tag === "new" ? "var(--sage-deep)" : "var(--rose-deep)",
                    }}
                  >
                    {tag === "new" ? "جديد" : "الأكثر مبيعاً"}
                  </span>
                )}
                {discount && (
                  <span
                    className="absolute top-2.5 start-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: "var(--red)" }}
                  >
                    -{discount}%
                  </span>
                )}
              </div>
              <div className="px-3.5 py-3">
                <div
                  className="font-marcellus text-[9px] tracking-[0.14em]"
                  style={{ color: "var(--gold)" }}
                >
                  ESIA
                </div>
                <div
                  className="text-sm font-semibold mt-0.5 min-h-[18px] dir-ltr"
                  style={{ color: "var(--plum)" }}
                >
                  {name || "اسم المنتج"}
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: c,
                        boxShadow: "0 0 0 1px var(--line)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: "var(--rose-deep)" }}
                  >
                    {price
                      ? `${parseFloat(price).toLocaleString()} ج.م`
                      : "— ج.م"}
                  </span>
                  {discount && (
                    <span
                      className="text-xs line-through"
                      style={{ color: "var(--gray)" }}
                    >
                      {parseFloat(originalPrice).toLocaleString()} ج.م
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PRODUCTS LIST ── */}
        <div className="mt-10">
          <h3
            className="font-marcellus text-base mb-3.5"
            style={{ color: "var(--plum)" }}
          >
            المنتجات المنشورة
          </h3>
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
                      "",
                      "المنتج",
                      "التصنيف",
                      "الألوان",
                      "السعر",
                      "الوسم",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="text-right px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide"
                        style={{ color: "var(--plum-soft)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b transition-colors"
                      style={{ borderColor: "var(--line)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--blush-soft)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                    >
                      <td className="px-4 py-3">
                        <div
                          className="rounded-lg flex items-center justify-center relative"
                          style={{
                            width: 34,
                            height: 44,
                            background: "var(--ivory-deep)",
                          }}
                        >
                          {p.img ? (
                            <img
                              src={p.img}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <SilhouetteSVG
                              shape={"puff"}
                              color={p.colors[0]?.hex ?? "#C67B90"}
                              className="w-[60%] h-[80%]"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm dir-ltr font-medium">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.category === "dresses"
                          ? "فساتين"
                          : p.category === "bags"
                            ? "حقائب"
                            : "إكسسوارات"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {p.colors.map((c, i) => (
                            <span
                              key={i}
                              className="w-3 h-3 rounded-full"
                              style={{
                                background: c.hex,
                                boxShadow: "0 0 0 1px var(--line)",
                              }}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.price.toLocaleString()} ج.م
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--plum-soft)" }}
                      >
                        {p.tag ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent"
                            style={{ border: "1px solid var(--line)" }}
                            title="تعديل المنتج"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              style={{ color: "var(--rose-deep)" }}
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent"
                            style={{ border: "1px solid var(--line)" }}
                            title="حذف المنتج"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              style={{ color: "var(--red)" }}
                            >
                              <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        className="block text-[12.5px] font-bold mb-1.5"
        style={{ color: "var(--plum-soft)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
