import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { adminOnly } from "../middlewares/auth.middleware";
import { generateDeviceId } from "../services/token.service";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  const data = await AuthService.register({ name, email, password, phone });
  res.status(201).json({ success: true, message: "Registration successful. Please check your email to confirm your account.", data, statusCode: 201 });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.body.token;
  const data = await AuthService.verifyEmail(token);
  res.status(200).json({ success: true, message: "Email verified successfully. You can now log in.", data, statusCode: 200 });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const data = await AuthService.resendVerification(email);
  res.status(200).json({ success: true, message: "Verification email sent. Please check your inbox.", data, statusCode: 200 });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const data = await AuthService.forgotPassword(email);
  res.status(200).json({ success: true, message: "If an account exists for this email, a password reset link has been sent.", data, statusCode: 200 });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.body.token as string) || (req.query.token as string);
  const { password, newPassword } = req.body;
  const data = await AuthService.resetPassword(token, newPassword || password);
  res.status(200).json({ success: true, message: "Password has been reset successfully. You can now log in.", data, statusCode: 200 });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, identifier, password } = req.body;
  const loginId = identifier || email || username;
  const deviceId = generateDeviceId();
  const data = await AuthService.login(loginId, password, deviceId);
  res.status(200).json({ success: true, message: "Operation completed successfully", data, statusCode: 200 });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken: string | undefined = req.body.refreshToken;
  const data = await AuthService.refresh(rawToken);
  res.status(200).json({ success: true, message: "Operation completed successfully", data, statusCode: 200 });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken: string | undefined = req.body.refreshToken;
  await AuthService.logout(rawToken);
  res.status(200).json({ success: true, message: "Operation completed successfully", data: null, statusCode: 200 });
});

export const me = (req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: "Operation completed successfully", data: { user: req.user }, statusCode: 200 });
};

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await AuthService.createAdmin({ email, password });
  res.status(201).json({ success: true, message: "Admin created successfully", data, statusCode: 201 });
});