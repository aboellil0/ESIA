import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { useCategories } from "../lib/categoryContext";
import { authService } from "../services/auth";
import { categoriesService, type Category } from "../services/categories";
import { colorsService, type Color } from "../services/colors";
import { systemService, type ApiProbe } from "../services/system";

const inputClass = "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9a4f63]";
const buttonClass = "rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50";

export default function AdminCatalog({ onNavigate, onLogout }: { onNavigate: (view: string) => void; onLogout: () => void }) {
  const categoryContext = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [colorNameEn, setColorNameEn] = useState("");
  const [colorNameAr, setColorNameAr] = useState("");
  const [hexCode, setHexCode] = useState("#9a4f63");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [probes, setProbes] = useState<ApiProbe[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);

  const checkApi = useCallback(async () => {
    setHealthLoading(true);
    setProbes(await systemService.probe());
    setHealthLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryRows, colorRows] = await Promise.all([
        categoriesService.list(),
        colorsService.list(),
      ]);
      setCategories(categoryRows);
      setColors(colorRows);
      await categoryContext.reload();
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
      setCategories([]);
      setColors([]);
    } finally {
      setLoading(false);
    }
  }, [categoryContext.reload]);

  useEffect(() => { void loadData(); void checkApi(); }, [loadData, checkApi]);

  const editCategory = async (id: number) => {
    setError(null);
    try {
      const category = await categoriesService.byId(id);
      setCategoryId(category.id);
      setCategoryName(category.name);
      setCategorySlug(category.slug);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  };

  const inspectCategory = async (slug: string) => {
    setError(null);
    try {
      const category = await categoriesService.bySlug(slug);
      setNotice("تم تحميل الفئة: " + category.name + " (" + category.slug + ")");
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (categoryId === null) {
        await categoriesService.create({ name: categoryName.trim(), slug: categorySlug.trim() || undefined });
      } else {
        await categoriesService.update(categoryId, { name: categoryName.trim(), slug: categorySlug.trim() });
      }
      setCategoryId(null);
      setCategoryName("");
      setCategorySlug("");
      setNotice("تم حفظ الفئة.");
      await loadData();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm("سيؤدي حذف «" + category.name + "» إلى حذف المنتجات المرتبطة بها أيضاً. هل تريد المتابعة؟")) return;
    setBusy(true);
    setError(null);
    try {
      await categoriesService.remove(category.id);
      setNotice("تم حذف الفئة.");
      await loadData();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  };

  const createColor = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await colorsService.create({ nameEn: colorNameEn.trim(), nameAr: colorNameAr.trim(), hexCode: hexCode.trim() });
      setColorNameEn("");
      setColorNameAr("");
      setNotice("تمت إضافة اللون.");
      await loadData();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const deleteColor = async (color: Color) => {
    if (!window.confirm("حذف اللون " + color.nameEn + "؟")) return;
    setBusy(true);
    setError(null);
    try {
      await colorsService.remove(color.id);
      setNotice("تم حذف اللون.");
      await loadData();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  };

  const createAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await authService.createAdmin({ email: adminEmail.trim(), password: adminPassword });
      setAdminEmail("");
      setAdminPassword("");
      setNotice("تم إنشاء حساب المدير.");
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--ivory)" }}>
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
        <div><strong className="font-marcellus text-xl" style={{ color: "var(--rose-deep)" }}>ESIA</strong><span className="ms-3 text-sm">إدارة الفئات والألوان</span></div>
        <nav className="flex flex-wrap gap-2">
          <button className={buttonClass + " border"} onClick={() => onNavigate("admin-orders")}>الطلبات</button>
          <button className={buttonClass + " border"} onClick={() => onNavigate("admin-products")}>المنتجات</button>
          <button className={buttonClass + " text-white"} style={{ background: "var(--rose-deep)" }}>الفئات والألوان</button>
          <button className={buttonClass + " border"} onClick={onLogout}>تسجيل الخروج</button>
        </nav>
      </header>
      <div className="mx-auto max-w-[1180px] space-y-6 px-5 py-8">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => void loadData()} className="ms-3 underline">إعادة المحاولة</button></p>}
        {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
        <section className="rounded-2xl bg-white p-4" style={{ border: "1px solid var(--line)" }}>
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold">حالة اتصال API</h2><button type="button" disabled={healthLoading} onClick={() => void checkApi()} className={buttonClass + " border"}>تحديث</button></div>
          {healthLoading ? <p role="status" className="text-sm">جارٍ فحص الاتصال...</p> : <div className="flex flex-wrap gap-2">{probes.map((probe) => <span key={probe.label} className="rounded-full px-3 py-1 text-xs" style={{ background: probe.ok ? "#e7f3e8" : "#fff0f1", color: probe.ok ? "#35683a" : "#a02c35" }}>{probe.ok ? "✓" : "×"} {probe.label}: {probe.detail}</span>)}</div>}
        </section>
        {loading ? <p role="status" className="py-12 text-center">جارٍ تحميل بيانات المتجر...</p> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid var(--line)" }}>
              <h1 className="mb-4 text-xl font-bold">الفئات</h1>
              <form onSubmit={saveCategory} className="mb-6 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">اسم الفئة<input required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className={inputClass} /></label>
                <label className="text-sm">المعرّف (Slug)<input value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className={inputClass} dir="ltr" /></label>
                <div className="flex gap-2 sm:col-span-2">
                  <button disabled={busy} className={buttonClass + " text-white"} style={{ background: "var(--rose-deep)" }}>{busy ? "جارٍ الحفظ..." : categoryId === null ? "إضافة فئة" : "حفظ التغييرات"}</button>
                  {categoryId !== null && <button type="button" onClick={() => { setCategoryId(null); setCategoryName(""); setCategorySlug(""); }} className={buttonClass + " border"}>إلغاء التعديل</button>}
                </div>
              </form>
              {categories.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">لا توجد فئات بعد.</p> : (
                <div className="space-y-2">{categories.map((category) => (
                  <div key={category.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                    <div><p className="font-semibold">{category.name}</p><p className="text-xs text-gray-500" dir="ltr">{category.slug}</p></div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void inspectCategory(category.slug)} className={buttonClass + " border"}>عرض</button>
                      <button type="button" onClick={() => void editCategory(category.id)} className={buttonClass + " border"}>تعديل</button>
                      <button type="button" disabled={busy} onClick={() => void deleteCategory(category)} className={buttonClass + " bg-red-50 text-red-700"}>حذف</button>
                    </div>
                  </div>
                ))}</div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid var(--line)" }}>
              <h2 className="mb-4 text-xl font-bold">الألوان العامة</h2>
              <form onSubmit={createColor} className="mb-6 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">الاسم بالإنجليزية<input required value={colorNameEn} onChange={(event) => setColorNameEn(event.target.value)} className={inputClass} dir="ltr" /></label>
                <label className="text-sm">الاسم بالعربية<input required value={colorNameAr} onChange={(event) => setColorNameAr(event.target.value)} className={inputClass} /></label>
                <label className="text-sm">اللون<input required pattern="#[0-9A-Fa-f]{6}" value={hexCode} onChange={(event) => setHexCode(event.target.value)} className={inputClass} dir="ltr" /></label>
                <button disabled={busy} className={buttonClass + " self-end text-white"} style={{ background: "var(--rose-deep)" }}>إضافة لون</button>
              </form>
              {colors.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">لا توجد ألوان بعد.</p> : (
                <div className="space-y-2">{colors.map((color) => (
                  <div key={color.id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-3"><span className="h-7 w-7 rounded-full border" style={{ background: color.hexCode }} /><span>{color.nameAr} <span className="text-xs text-gray-500" dir="ltr">({color.nameEn})</span></span></div>
                    <button type="button" disabled={busy} onClick={() => void deleteColor(color)} className={buttonClass + " bg-red-50 text-red-700"}>حذف</button>
                  </div>
                ))}</div>
              )}
              <p className="mt-4 text-xs leading-6 text-gray-500">إدارة ألوان المنتج عند الإنشاء تستخدم لوحة ProductColor التي يعيدها backend ضمن المنتجات الحالية.</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2" style={{ border: "1px solid var(--line)" }}>
              <h2 className="mb-2 text-xl font-bold">إنشاء حساب مدير</h2>
              <p className="mb-4 text-sm text-gray-600">يوفر backend مساراً لإنشاء مدير. الوصول إلى هذه الشاشة محمي بدور المدير في الواجهة.</p>
              <form onSubmit={createAdmin} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <label className="text-sm">البريد الإلكتروني<input required type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className={inputClass} dir="ltr" /></label>
                <label className="text-sm">كلمة المرور<input required type="password" minLength={8} value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className={inputClass} dir="ltr" /></label>
                <button disabled={busy} className={buttonClass + " self-end text-white"} style={{ background: "var(--rose-deep)" }}>إنشاء مدير</button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
