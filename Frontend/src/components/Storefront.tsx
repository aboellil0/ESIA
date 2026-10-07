import { useEffect, useState, type ReactNode } from "react";
import { mapBackendProduct, type CatalogProduct } from "../data/catalog";
import { getApiErrorMessage } from "../lib/api";
import { useCategories } from "../lib/categoryContext";
import { categoriesService } from "../services/categories";
import { productsService } from "../services/products";
import { ProductCard, SiteChrome } from "./SiteChrome";

interface Props {
  view: string;
  categorySlug?: string;
  onNavigate: (view: string, productId?: string) => void;
  cart: number;
  showGuestSignIn?: boolean;
}

const VIEW_CATEGORY: Record<string, string> = {
  dresses: "dresses",
  bags: "bags",
  accessories: "accessories",
};

export default function Storefront({
  view,
  categorySlug: categorySlugProp,
  onNavigate,
  cart,
  showGuestSignIn,
}: Props) {
  const { categories, error: categoriesError, reload: reloadCategories } = useCategories();
  const categorySlug = categorySlugProp ?? VIEW_CATEGORY[view];
  const [categoryName, setCategoryName] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(view !== "story");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!categorySlug) {
      setCategoryName("");
      return;
    }
    let current = true;
    const cached = categories.find((item) => item.slug === categorySlug);
    if (cached) setCategoryName(cached.name);
    categoriesService.bySlug(categorySlug)
      .then((category) => {
        if (current) setCategoryName(category.name);
      })
      .catch((loadError) => {
        if (current) setError(getApiErrorMessage(loadError));
      });
    return () => {
      current = false;
    };
  }, [categorySlug, categories, retryKey]);

  useEffect(() => {
    if (view === "story") {
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    setError(null);
    productsService.list(categorySlug ? { categorySlug } : undefined)
      .then((items) => {
        if (current) setProducts(items.map(mapBackendProduct).filter((item): item is CatalogProduct => item !== null && item.isActive));
      })
      .catch((loadError) => {
        if (current) {
          setProducts([]);
          setError(getApiErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [view, categorySlug, retryKey]);

  const title = view === "story" ? "قصتنا" : categorySlug ? categoryName || "الفئة" : "اكتشفي المنتجات";
  const subtitle = view === "story"
    ? "إيسيا، تفاصيل هادئة وأناقة يومية."
    : categorySlug
      ? ""
      : "قطع مختارة لإطلالة أنيقة في كل مناسبة";

  return (
    <SiteChrome
      view={categorySlug ? "category:" + categorySlug : view}
      onNavigate={onNavigate}
      cart={cart}
      showGuestSignIn={showGuestSignIn}
    >
      {view === "story" ? (
        <section className="mx-auto grid max-w-[1100px] items-center gap-8 px-6 py-16 md:grid-cols-2">
          <div className="rounded-3xl border bg-white p-12 text-center" style={{ borderColor: "var(--line)" }}>
            <img src="/assets/esia-logo-hero.png" alt="ESIA" className="mx-auto max-h-80 object-contain" />
          </div>
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.14em]" style={{ color: "var(--gold)" }}>ESIA COUTURE</p>
            <h1 className="mb-4 font-marcellus text-4xl" style={{ color: "var(--plum)" }}>قصتنا</h1>
            <p className="leading-8" style={{ color: "var(--plum-soft)" }}>
              نصمم قطعاً تجمع بين أصالة التفاصيل وروح عصرية هادئة. اكتشفي المنتجات المتاحة في متجر إيسيا.
            </p>
            <button type="button" onClick={() => onNavigate("home")} className="mt-6 rounded-xl px-6 py-3 font-bold text-white" style={{ background: "var(--rose-deep)" }}>
              تسوقي المجموعة
            </button>
          </div>
        </section>
      ) : (
        <>
          {view === "home" && (
            <section className="mx-auto max-w-[1260px] px-4 pt-8">
              <div className="grid min-h-[360px] overflow-hidden rounded-3xl border bg-white lg:grid-cols-2" style={{ borderColor: "var(--line)" }}>
                <div className="flex min-h-[260px] items-center justify-center bg-[#f5e9e8] p-8">
                  <img src="/assets/esia-logo-hero.png" alt="ESIA Couture" className="max-h-72 object-contain" />
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-14">
                  <p className="text-xs font-bold tracking-[0.18em]" style={{ color: "var(--gold)" }}>ESIA HAUTE COUTURE</p>
                  <h1 className="mt-4 font-marcellus text-4xl" style={{ color: "var(--plum)" }}>إطلالة ملكية بتفاصيل هادئة</h1>
                  <p className="mt-4 leading-8" style={{ color: "var(--plum-soft)" }}>اكتشفي المنتجات المتاحة حالياً في مجموعتنا.</p>
                  <button type="button" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })} className="mt-6 w-fit rounded-xl px-6 py-3 font-bold text-white" style={{ background: "var(--rose-deep)" }}>
                    استكشفي المنتجات
                  </button>
                </div>
              </div>
            </section>
          )}

          <section id="explore" className="mx-auto w-full max-w-[1260px] px-4 py-10">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-marcellus text-3xl" style={{ color: "var(--plum)" }}>{title}</h1>
                {subtitle && <p className="mt-2 text-sm" style={{ color: "var(--plum-soft)" }}>{subtitle}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={!categorySlug} onClick={() => onNavigate("home")}>الكل</Chip>
                {categories.map((category) => (
                  <Chip key={category.id} active={categorySlug === category.slug} onClick={() => onNavigate("category:" + category.slug)}>
                    {category.name}
                  </Chip>
                ))}
              </div>
            </div>

            {(error || categoriesError) && (
              <div role="alert" className="my-6 rounded-2xl bg-white p-5 text-center text-sm text-red-700">
                {error ?? categoriesError}
                <button type="button" onClick={() => { setError(null); setRetryKey((value) => value + 1); void reloadCategories(); }} className="ms-3 underline">إعادة المحاولة</button>
              </div>
            )}
            {loading && <p className="py-20 text-center" role="status">جارٍ تحميل المنتجات...</p>}
            {!loading && !error && products.length === 0 && (
              <p className="py-20 text-center" style={{ color: "var(--plum-soft)" }}>لا توجد منتجات متاحة في هذه الفئة حالياً.</p>
            )}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((item) => <ProductCard key={item.id} item={item} onOpen={(id) => onNavigate("product", id)} />)}
              </div>
            )}
          </section>
        </>
      )}
    </SiteChrome>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border px-4 py-2 text-xs font-semibold"
      style={active ? { background: "var(--rose-deep)", color: "#fff", borderColor: "var(--rose-deep)" } : { background: "#fff", color: "var(--plum-soft)", borderColor: "var(--line)" }}>
      {children}
    </button>
  );
}
