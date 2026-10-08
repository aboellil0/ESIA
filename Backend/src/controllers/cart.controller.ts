import { Request, Response } from "express";
import { IsNull } from "typeorm";
import { CartService } from "../services/cart.service";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/data-source";
import { Cart } from "../models/Cart";

// req.user.id comes from the JWT payload as a string at runtime — normalize it
// so logged-in users always hit their DB user cart (never a guest cart).
const getUserId = (req: Request): number | undefined => {
  const id = Number(req.user?.id);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const guestToken = req.headers["x-guest-token"] as string | undefined;

  const cart = await CartService.getCart(userId, guestToken);

  res.json({
    success: true,
    message: cart ? "Cart retrieved successfully" : "Cart is empty",
    data: cart,
    statusCode: 200,
  });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const guestToken = req.headers["x-guest-token"] as string | undefined;
  const { productId, quantity, colorId, size } = req.body;

  if (!productId || !quantity) {
    throw new AppError("productId and quantity are required", 400);
  }

  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than 0", 400);
  }

  const cart = await CartService.addItem(userId, guestToken, {
    productId,
    quantity,
    colorId,
    size,
  });

  res.status(201).json({
    success: true,
    message: "Item added to cart",
    data: cart,
    statusCode: 201,
  });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const guestToken = req.headers["x-guest-token"] as string | undefined;
  const itemId = Number(req.params.itemId);
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null || quantity < 0) {
    throw new AppError("Quantity is required and must be >= 0", 400);
  }

  const cart = await CartService.updateQuantity(userId, guestToken, itemId, quantity);

  res.json({
    success: true,
    message: "Cart item updated",
    data: cart,
    statusCode: 200,
  });
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const guestToken = req.headers["x-guest-token"] as string | undefined;
  const itemId = Number(req.params.itemId);

  const cart = await CartService.removeItem(userId, guestToken, itemId);

  res.json({
    success: true,
    message: "Item removed from cart",
    data: cart,
    statusCode: 200,
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const guestToken = req.headers["x-guest-token"] as string | undefined;

  await CartService.clearCart(userId, guestToken);

  res.json({
    success: true,
    message: "Cart cleared",
    data: null,
    statusCode: 200,
  });
});

export const mergeCarts = asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.user!.id);
  const { items, guestToken } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("items array is required", 400);
  }

  const cart = await CartService.mergeCarts(userId, items);

  // Guest cart has been absorbed into the user cart — remove the orphaned
  // guest row so it can never resurface (only delete true guest carts).
  if (typeof guestToken === "string" && guestToken) {
    try {
      await AppDataSource.getRepository(Cart).delete({ guestToken, userId: IsNull() });
    } catch {}
  }

  res.json({
    success: true,
    message: "Carts merged successfully",
    data: cart,
    statusCode: 200,
  });
});