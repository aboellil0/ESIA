import { api } from "./api";

export async function registerApi(input: { name: string; email: string; password: string; phone?: string }) {
  const { data } = await api.post("/auth/register", input);
  return data;
}

export async function loginApi(input: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", input);
  return data;
}

export async function verifyEmailApi(token: string) {
  const { data } = await api.get("/auth/verify-email", { params: { token } });
  return data;
}

export async function resendVerificationApi(email: string) {
  const { data } = await api.post("/auth/resend-verification", { email });
  return data;
}

export async function forgotPasswordApi(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPasswordApi(token: string, newPassword: string) {
  const { data } = await api.post("/auth/reset-password", { token, newPassword });
  return data;
}

export function getApiErrorMessage(err: any, fallback = "Something went wrong."): string {
  return err?.response?.data?.message || err?.message || fallback;
}

export function isEmailNotVerifiedError(err: any): boolean {
  return err?.response?.status === 403 && err?.response?.data?.code === "EMAIL_NOT_VERIFIED";
}
