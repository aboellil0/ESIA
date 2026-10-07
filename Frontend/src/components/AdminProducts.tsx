import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { useCategories } from "../lib/categoryContext";
import { productsService } from "../services/products";
import { colorsService } from "../services/colors";

type PaletteColor = { id: number; nameEn: string; nameAr: string; hexCode: string };
type ProductImage = { id: number; imageUrl: string; sortOrder: number; isMain: boolean };
type ProductRow = {
  id: number;
  name: string;
  price: number;
  mainImageUrl?: string | null;
  category?: { name?: string; slug?: string } | null;
  colors?: PaletteColor[];
  sizes?: Array<{ id?: number; size: string; isAvailable?: boolean }>;
  images?: ProductImage[];
  shortDescription?: string | null;
};

const SIZES = ["S", "M", "L", "XL"];
const inputClass = "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9a4f63]";
const btnClass = "rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50";

export default function AdminProducts({ onNavigate, onLogout }: { onNavigate: (view: string) => void; onLogout: () => void }) {
  const { categories } = useCategories();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [tag, setTag] = useState("none");
  const [shape, setShape] = useState("");
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L"]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [globalPalette, setGlobalPalette] = useState<PaletteColor[]>([]);

  const palette = useMemo(() => {
    // Primary source: global /colors palette (works even with zero products).
    // Fallback: colors found on existing products (legacy/clone flow).
    const source = globalPalette.length ? globalPalette : products.flatMap((product) => product.colors ?? []);
    const unique = new Map<string, PaletteColor>();
    for (const color of source) {
      if (!color || !color.hexCode || !color.nameEn) continue;
      const key = String(color.hexCode).toLowerCase() + "|" + String(color.nameEn).toLowerCase();
      if (!unique.has(key)) unique.set(key, color);
    }
    return [...unique.values()];
  }, [products, globalPalette]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, paletteColors] = await Promise.all([
        productsService.list(),
        colorsService.list().catch(() => [] as PaletteColor[]),
      ]);
      setGlobalPalette(Array.isArray(paletteColors) ? paletteColors : []);
      const rows = Array.isArray(data) ? data as ProductRow[] : [];
      setProducts(rows);
      if (selected) {
        const current = rows.find((item) => item.id === selected.id);
        if (current) {
          const full = await productsService.byId(current.id);
          setSelected(full as ProductRow);
        }
      }
    } catch (loadError) {
      setProducts([]);
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const selectProduct = async (id: number) => {
    setBusy(true);
    setError(null);
    try {
      setSelected(await productsService.byId(id) as ProductRow);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setBusy(false);
    }
  };

  const makeIndexedForm = (files: File[], makeFirstMain: boolean) => {
    const form = new FormData();
    files.forEach((file, index) => {
      form.append("image[" + index + "]", file);
      form.append("image[" + index + "].isMain", makeFirstMain && index === 0 ? "true" : "false");
    });
    return form;
  };

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedColorIds.length) {
      setError("اختر لوناً واحداً على الأقل من لوحة الألوان الموجودة في المنتجات.");
      return;
    }
    if (!selectedSizes.length) {
      setError("اختر مقاساً واحداً على الأقل.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const form = makeIndexedForm(imageFiles, true);
      form.append("name", name.trim());
      form.append("categoryId", categoryId);
      form.append("price", price);
      if (oldPrice) form.append("oldPrice", oldPrice);
      form.append("shortDescription", shortDescription.trim());
      form.append("tag", tag);
      if (shape) form.append("defaultShape", shape);
      form.append("colors", JSON.stringify(selectedColorIds));
      form.append("sizes", JSON.stringify(selectedSizes.map((size) => ({ size, isAvailable: true }))));
      await productsService.create(form);
      setName("");
      setPrice("");
      setOldPrice("");
      setShortDescription("");
      setImageFiles([]);
      setNotice("تم إنشاء المنتج.");
      await loadProducts();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setBusy(false);
    }
  };

  const addImages = async () => {
    if (!selected || !newImageFiles.length) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await productsService.addImages(selected.id, makeIndexedForm(newImageFiles, false));
      setSelected(updated as ProductRow);
      setNewImageFiles([]);
      setNotice("تمت إضافة الصور.");
      await loadProducts();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async (image: ProductImage) => {
    if (!selected || !window.confirm("حذف هذه الصورة؟")) return;
    setBusy(true);
    setError(null);
    try {
      setSelected(await productsService.removeImage(selected.id, image.sortOrder) as ProductRow);
      setNotice("تم حذف الصورة.");
      await loadProducts();
    } catch (removeError) {
      setError(getApiErrorMessage(removeError));
    } finally {
      setBusy(false);
    }
  };

  const setMainImage = async (image: ProductImage) => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      setSelected(await productsService.setMainImage(selected.id, image.id) as ProductRow);
      setNotice("تم تعيين الصورة الرئيسية.");
      await loadProducts();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const moveImage = async (image: ProductImage, direction: -1 | 1) => {
    if (!selected) return;
    const next = image.sortOrder + direction;
    if (next < 0 || next >= (selected.images?.length ?? 0)) return;
    setBusy(true);
    setError(null);
    try {
      setSelected(await productsService.reorderImages(selected.id, image.sortOrder, next) as ProductRow);
      setNotice("تم تغيير ترتيب الصور.");
      await loadProducts();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const toggleSize = (size: string) => setSelectedSizes((values) => values.includes(size) ? values.filter((value) => value !== size) : [...values, size]);
  const toggleColor = (id: number) => setSelectedColorIds((values) => values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);

  return (
    <main className="min-h-screen" style={{ background: "var(--ivory)" }}>
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
        <div><strong className="font-marcellus text-xl" style={{ color: "var(--rose-deep)" }}>ESIA</strong><span className="ms-3 text-sm">إدارة المنتجات</span></div>
        <nav className="flex flex-wrap gap-2">
          <button className={btnClass + " border"} onClick={() => onNavigate("admin-orders")}>الطلبات</button>
          <button className={btnClass + " text-white"} style={{ background: "var(--rose-deep)" }}>المنتجات</button>
          <button className={btnClass + " border"} onClick={() => onNavigate("admin-catalog")}>الفئات والألوان</button>
          <button className={btnClass + " border"} onClick={onLogout}>تسجيل الخروج</button>
        </nav>
      </header>
      <div className="mx-auto max-w-[1260px] space-y-6 px-5 py-8">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => void loadProducts()} className="ms-3 underline">إعادة التحميل</button></p>}
        {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
        {loading ? <p role="status" className="py-12 text-center">جارٍ تحميل المنتجات...</p> : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl bg-white p-5" style={{ border: "1px solid var(--line)" }}>
              <h1 className="mb-4 text-xl font-bold">المنتجات الحالية</h1>
              {error ? null : products.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">لا توجد منتجات بعد.</p> : (
                <div className="space-y-2">{products.map((product) => (
                  <button key={product.id} type="button" onClick={() => void selectProduct(product.id)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-right" style={{ borderColor: selected?.id === product.id ? "var(--rose-deep)" : "var(--line)" }}>
                    {product.mainImageUrl ? <img src={product.mainImageUrl} alt="" className="h-14 w-12 rounded-lg object-cover" /> : <span className="h-14 w-12 rounded-lg bg-[#f5e9e8]" />}
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{product.name}</span><span className="text-xs text-gray-500">{product.category?.name ?? product.category?.slug} · {Number(product.price).toLocaleString()} ج.م</span></span>
                  </button>
                ))}</div>
              )}
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl bg-white p-5" style={{ border: "1px solid var(--line)" }}>
                <h2 className="mb-4 text-xl font-bold">إضافة منتج</h2>
                <form onSubmit={createProduct} className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">اسم المنتج<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
                  <label className="text-sm">الفئة<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass}><option value="">اختر الفئة</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <label className="text-sm">السعر<input required type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass} /></label>
                  <label className="text-sm">السعر السابق (اختياري)<input type="number" min="0" step="0.01" value={oldPrice} onChange={(event) => setOldPrice(event.target.value)} className={inputClass} /></label>
                  <label className="text-sm">الشارة<select value={tag} onChange={(event) => setTag(event.target.value)} className={inputClass}><option value="none">بدون</option><option value="new">جديد</option><option value="best_seller">الأكثر مبيعاً</option></select></label>
                  <label className="text-sm">الشكل<select value={shape} onChange={(event) => setShape(event.target.value)} className={inputClass}><option value="">بدون</option><option value="puff_sleeves">أكمام منفوشة</option><option value="layers">طبقات</option><option value="bow">فيونكة</option><option value="long">طويل</option><option value="abaya">عباية</option><option value="circular">دائري</option></select></label>
                  <label className="text-sm md:col-span-2">وصف قصير<textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className={inputClass} rows={3} /></label>
                  <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold">الألوان</legend>{palette.length ? <div className="flex flex-wrap gap-2">{palette.map((color) => <label key={color.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: "var(--line)" }}><input type="checkbox" checked={selectedColorIds.includes(color.id)} onChange={() => toggleColor(color.id)} /><span className="h-4 w-4 rounded-full border" style={{ background: color.hexCode }} />{color.nameAr}</label>)}</div> : <p className="text-sm text-amber-700">لا توجد ألوان منتجات متاحة للاختيار. أضف منتجاً أولاً أو جهّز لوحة ProductColor في البيانات.</p>}</fieldset>
                  <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold">المقاسات</legend><div className="flex gap-4">{SIZES.map((size) => <label key={size} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />{size}</label>)}</div></fieldset>
                  <label className="text-sm md:col-span-2">صور المنتج<input type="file" accept="image/*" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} className={inputClass} /><span className="mt-1 block text-xs text-gray-500">يتم رفع الصور مباشرة مع إنشاء المنتج.</span></label>
                  <button disabled={busy || !categories.length || !palette.length} className={btnClass + " md:col-span-2 text-white"} style={{ background: "var(--rose-deep)" }}>{busy ? "جارٍ الحفظ..." : "إنشاء المنتج"}</button>
                </form>
              </section>

              {selected && (
                <section className="rounded-2xl bg-white p-5" style={{ border: "1px solid var(--line)" }}>
                  <h2 className="text-xl font-bold">صور: {selected.name}</h2>
                  <p className="mb-4 mt-1 text-sm text-gray-600">يوفر backend إدارة الصور فقط للمنتج الموجود. لا توجد مسارات لتعديل الاسم أو السعر أو حذف المنتج.</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <input type="file" accept="image/*" multiple onChange={(event) => setNewImageFiles(Array.from(event.target.files ?? []))} className="min-w-0 flex-1 rounded-xl border p-2 text-sm" />
                    <button type="button" disabled={busy || !newImageFiles.length} onClick={() => void addImages()} className={btnClass + " text-white"} style={{ background: "var(--rose-deep)" }}>رفع الصور</button>
                  </div>
                  {!selected.images?.length ? <p className="py-6 text-center text-sm text-gray-500">لا توجد صور مسجلة لهذا المنتج.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[...selected.images].sort((a, b) => a.sortOrder - b.sortOrder).map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--line)" }}>
                      <img src={image.imageUrl} alt="" className="h-44 w-full object-cover" />
                      <div className="flex flex-wrap items-center justify-between gap-1 p-2 text-xs">
                        <span>{image.isMain ? "الصورة الرئيسية" : "ترتيب " + (image.sortOrder + 1)}</span>
                        <div className="flex gap-1">
                          <button type="button" disabled={busy || image.isMain} onClick={() => void setMainImage(image)} title="تعيين كرئيسية">★</button>
                          <button type="button" disabled={busy || image.sortOrder === 0} onClick={() => void moveImage(image, -1)} title="تحريك للأمام">←</button>
                          <button type="button" disabled={busy || image.sortOrder === selected.images!.length - 1} onClick={() => void moveImage(image, 1)} title="تحريك للخلف">→</button>
                          <button type="button" disabled={busy} onClick={() => void removeImage(image)} className="text-red-700">حذف</button>
                        </div>
                      </div>
                    </div>
                  ))}</div>}
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
