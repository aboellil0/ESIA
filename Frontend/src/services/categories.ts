import { api, unwrapApiResult } from "../lib/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export const categoriesService = {
  async list() {
    const response = await api.get("/categories");
    return (unwrapApiResult<Category[]>(response) ?? []);
  },
  async byId(id: number) {
    const response = await api.get("/categories/" + encodeURIComponent(String(id)));
    return unwrapApiResult<Category>(response);
  },
  async bySlug(slug: string) {
    const response = await api.get("/categories/slug/" + encodeURIComponent(slug));
    return unwrapApiResult<Category>(response);
  },
  async create(input: { name: string; slug?: string }) {
    const response = await api.post("/categories", input);
    return unwrapApiResult<Category>(response);
  },
  async update(id: number, input: { name?: string; slug?: string }) {
    const response = await api.patch("/categories/" + encodeURIComponent(String(id)), input);
    return unwrapApiResult<Category>(response);
  },
  async remove(id: number) {
    const response = await api.delete("/categories/" + encodeURIComponent(String(id)));
    return unwrapApiResult<null>(response);
  },
};
