import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { generateDeviceId } from "../services/token.service";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  const data = await AuthService.register({ name, email, password, phone });
  res.status(201).json({ success: true, message: "Operation completed successfully", data, statusCode: 201 });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, identifier, password } = req.body;
  const loginId = identifier || email || username;
  const deviceId = generateDeviceId();
  const data = await AuthService.login(loginId, password, deviceId);
  res.status(200).json({ success: true, message: "Operation completed successfully", data, statusCode: 200 });
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, identifier, password } = req.body;
  const loginId = identifier || email || username;
  const deviceId = generateDeviceId();
  const data = await AuthService.adminLogin(loginId, password, deviceId);
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