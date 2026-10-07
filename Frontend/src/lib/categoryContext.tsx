import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getApiErrorMessage } from "./api";
import { categoriesService, type Category } from "../services/categories";

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const CategoryContext = createContext<CategoryState | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await categoriesService.list();
      setCategories(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <CategoryContext.Provider value={{ categories, loading, error, reload }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const value = useContext(CategoryContext);
  if (!value) throw new Error("useCategories must be used within CategoriesProvider");
  return value;
}
