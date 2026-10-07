import { api } from "../lib/api";

export interface ApiProbe {
  label: string;
  ok: boolean;
  detail: string;
}

export const systemService = {
  async probe(): Promise<ApiProbe[]> {
    const checks = [
      { label: "API /api", url: "/" },
      { label: "Health /api/health", url: "/health" },
      { label: "API /api/v1", url: "/v1/" },
      { label: "Health /api/v1/health", url: "/v1/health" },
    ];
    return Promise.all(checks.map(async (check) => {
      try {
        const response = await api.get(check.url);
        return { label: check.label, ok: true, detail: String(response.data?.message ?? response.data?.status ?? "متصل") };
      } catch (error) {
        return { label: check.label, ok: false, detail: (error as any)?.message ?? "تعذر الاتصال" };
      }
    }));
  },
};
