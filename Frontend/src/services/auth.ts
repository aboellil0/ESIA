import { api, unwrapApiResult } from "../lib/api";

export const authService = {
  async register(input: { name: string; email: string; password: string; phone?: string }) {
    const response = await api.post("/auth/register", input);
    return unwrapApiResult<any>(response);
  },
  async login(input: { email: string; password: string }) {
    const response = await api.post("/auth/login", input);
    return unwrapApiResult<any>(response);
  },
  async refresh(refreshToken: string) {
    const response = await api.post("/auth/refresh", { refreshToken });
    return unwrapApiResult<any>(response);
  },
  async logout(refreshToken?: string | null) {
    const response = await api.post("/auth/logout", { refreshToken: refreshToken || undefined });
    return unwrapApiResult<any>(response);
  },
  async me() {
    const response = await api.get("/auth/me");
    return unwrapApiResult<any>(response);
  },
  async profile() {
    const response = await api.get("/auth/profile");
    return unwrapApiResult<any>(response);
  },
  async updateProfile(input: { name?: string; phone?: string }) {
    const response = await api.patch("/auth/profile", input);
    return unwrapApiResult<any>(response);
  },
  async changePassword(input: { currentPassword: string; newPassword: string }) {
    const response = await api.post("/auth/change-password", input);
    return unwrapApiResult<any>(response);
  },
  async verifyEmail(token: string) {
    const response = await api.get("/auth/verify-email", { params: { token } });
    return unwrapApiResult<any>(response);
  },
  async resendVerification(email: string) {
    const response = await api.post("/auth/resend-verification", { email });
    return unwrapApiResult<any>(response);
  },
  async requestPasswordReset(email: string) {
    const response = await api.post("/auth/forgot-password", { email });
    return unwrapApiResult<any>(response);
  },
  async resetPassword(input: { token: string; password: string }) {
    const response = await api.post("/auth/reset-password", input);
    return unwrapApiResult<any>(response);
  },
  async createAdmin(input: { email: string; password: string }) {
    const response = await api.post("/auth/admins", input);
    return unwrapApiResult<any>(response);
  },
};
