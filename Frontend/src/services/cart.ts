import axios from "axios";
import { api, apiBaseUrl, unwrapApiResult } from "../lib/api";

export interface CartInputItem {
  productId: number;
  quantity: number;
  colorId?: number;
  size?: string;
}

export const cartService = {
  async get() {
    const response = await api.get("/cart");
    return unwrapApiResult<any>(response);
  },
  async getGuestCart() {
    const guestToken = localStorage.getItem("esia-guest-token");
    if (!guestToken) return null;
    const response = await axios.get(apiBaseUrl + "/cart", {
      headers: { Accept: "application/json", "x-guest-token": guestToken },
    });
    return unwrapApiResult<any>(response);
  },
  async add(input: CartInputItem) {
    const response = await api.post("/cart/items", input);
    return unwrapApiResult<any>(response);
  },
  async update(itemId: number, quantity: number) {
    const response = await api.patch("/cart/items/" + encodeURIComponent(String(itemId)), { quantity });
    return unwrapApiResult<any>(response);
  },
  async remove(itemId: number) {
    const response = await api.delete("/cart/items/" + encodeURIComponent(String(itemId)));
    return unwrapApiResult<any>(response);
  },
  async clear() {
    const response = await api.delete("/cart");
    return unwrapApiResult<null>(response);
  },
  async merge(items: CartInputItem[], guestToken?: string | null) {
    const response = await api.post("/cart/merge", { items, guestToken: guestToken || undefined });
    return unwrapApiResult<any>(response);
  },
};
