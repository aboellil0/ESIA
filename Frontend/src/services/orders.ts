import { api, unwrapApiResult } from "../lib/api";

export interface OrderListParams {
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export const ordersService = {
  async create(input: FormData | Record<string, unknown>) {
    const response = await api.post("/orders", input);
    return unwrapApiResult<any>(response);
  },
  async track(orderNumber: string) {
    const response = await api.get("/orders/track/" + encodeURIComponent(orderNumber));
    return unwrapApiResult<any>(response);
  },
  async myOrders(params?: OrderListParams) {
    const response = await api.get("/orders/my-orders", { params });
    return unwrapApiResult<any>(response);
  },
  async myOrderById(id: number | string) {
    const response = await api.get("/orders/my-orders/" + encodeURIComponent(String(id)));
    return unwrapApiResult<any>(response);
  },
  async list(params?: OrderListParams) {
    const response = await api.get("/orders", { params });
    return unwrapApiResult<any>(response);
  },
  async byId(id: number | string) {
    const response = await api.get("/orders/" + encodeURIComponent(String(id)));
    return unwrapApiResult<any>(response);
  },
  async updateStatus(id: number | string, input: { status: string; trackingNumber?: string }) {
    const response = await api.patch(
      "/orders/" + encodeURIComponent(String(id)) + "/status",
      input,
    );
    return unwrapApiResult<any>(response);
  },
  async verifyPayment(id: number | string, input: { action: "verify" | "reject"; rejectionReason?: string }) {
    const response = await api.patch(
      "/orders/" + encodeURIComponent(String(id)) + "/verify-payment",
      input,
    );
    return unwrapApiResult<any>(response);
  },
  async updateNotes(id: number | string, notes: string) {
    const response = await api.patch(
      "/orders/" + encodeURIComponent(String(id)) + "/notes",
      { notes },
    );
    return unwrapApiResult<any>(response);
  },
};
