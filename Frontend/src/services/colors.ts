import { api, unwrapApiResult } from "../lib/api";

export interface Color {
  id: number;
  nameEn: string;
  nameAr: string;
  hexCode: string;
}

export const colorsService = {
  async list() {
    const response = await api.get("/colors");
    return (unwrapApiResult<Color[]>(response) ?? []);
  },
  async create(input: Omit<Color, "id">) {
    const response = await api.post("/colors", input);
    return unwrapApiResult<Color>(response);
  },
  async remove(id: number) {
    const response = await api.delete("/colors/" + encodeURIComponent(String(id)));
    return unwrapApiResult<null>(response);
  },
};
