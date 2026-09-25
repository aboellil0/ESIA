import { AppDataSource } from "../config/data-source";
import { Cart } from "../models/Cart";
import { CartItem } from "../models/CartItem";
import { Product } from "../models/Product";
import { ProductSize } from "../models/enums";
import { AppError } from "../utils/AppError";
import crypto from "crypto";

interface CartItemInput {
  productId: number;
  quantity: number;
  colorNameEn?: string;
  colorNameAr?: string;
  colorHex?: string;
  size?: string;
}

interface CartResponse {
  id: number;
  userId: number | null;
  guestToken: string | null;
  items: CartItemWithProduct[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItemWithProduct {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  colorNameEn: string | null;
  colorNameAr: string | null;
  colorHex: string | null;
  size: string | null;
  quantity: number;
  productImage: string | null;
  product: {
    id: number;
    name: string;
    price: number;
    mainImageUrl: string | null;
    colors: Array<{ id: number; nameEn: string; nameAr: string | null; hexCode: string | null }>;
    sizes: string[];
  } | null;
}

class CartServiceImpl {
  private cartRepo = AppDataSource.getRepository(Cart);
  private cartItemRepo = AppDataSource.getRepository(CartItem);
  private productRepo = AppDataSource.getRepository(Product);

  private generateGuestToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private buildItemWhereClause(cartId: number, input: CartItemInput) {
    const where: any = { cartId, productId: input.productId };
    if (input.colorNameEn) where.colorNameEn = input.colorNameEn;
    if (input.colorHex) where.colorHex = input.colorHex;
    if (input.size) where.size = input.size as ProductSize;
    return where;
  }

  async getOrCreateCart(userId?: number, guestToken?: string): Promise<Cart> {
    let cart: Cart | null = null;

    if (userId) {
      cart = await this.cartRepo.findOne({
        where: { userId },
        relations: { items: true },
      });
    } else if (guestToken) {
      cart = await this.cartRepo.findOne({
        where: { guestToken },
        relations: { items: true },
      });
    }

    if (!cart) {
      cart = this.cartRepo.create({
        userId: userId ?? null,
        guestToken: userId ? null : (guestToken ?? this.generateGuestToken()),
      });
      cart = await this.cartRepo.save(cart);
    } else if (!userId && !cart.guestToken) {
      cart.guestToken = this.generateGuestToken();
      cart = await this.cartRepo.save(cart);
    }

    return cart;
  }

  async getCart(userId?: number, guestToken?: string): Promise<CartResponse | null> {
    let cart: Cart | null = null;

    if (userId) {
      cart = await this.cartRepo.findOne({
        where: { userId },
        relations: { items: true },
      });
    } else if (guestToken) {
      cart = await this.cartRepo.findOne({
        where: { guestToken },
        relations: { items: true },
      });
    }

    if (!cart) return null;

    return this.formatCartResponse(cart);
  }

  async addItem(userId: number | undefined, guestToken: string | undefined, input: CartItemInput): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestToken);

    const product = await this.productRepo.findOne({ where: { id: input.productId } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const whereClause = this.buildItemWhereClause(cart.id, input);
    let cartItem = await this.cartItemRepo.findOne({ where: whereClause });

    if (cartItem) {
      cartItem.quantity += input.quantity;
      await this.cartItemRepo.save(cartItem);
    } else {
      cartItem = this.cartItemRepo.create({
        cartId: cart.id,
        productId: input.productId,
        productName: product.name,
        unitPrice: product.price,
        colorNameEn: input.colorNameEn ?? null,
        colorNameAr: input.colorNameAr ?? null,
        colorHex: input.colorHex ?? null,
        size: input.size ? (input.size as ProductSize) : null,
        quantity: input.quantity,
        productImage: product.mainImageUrl ?? null,
      });
      await this.cartItemRepo.save(cartItem);
    }

    return this.getCart(userId, cart.guestToken ?? undefined) as Promise<CartResponse>;
  }

  async updateQuantity(userId: number | undefined, guestToken: string | undefined, itemId: number, quantity: number): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestToken);

    const cartItem = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    if (quantity <= 0) {
      await this.cartItemRepo.remove(cartItem);
    } else {
      cartItem.quantity = quantity;
      await this.cartItemRepo.save(cartItem);
    }

    return this.getCart(userId, cart.guestToken ?? undefined) as Promise<CartResponse>;
  }

  async removeItem(userId: number | undefined, guestToken: string | undefined, itemId: number): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestToken);

    const cartItem = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    await this.cartItemRepo.remove(cartItem);

    return this.getCart(userId, cart.guestToken ?? undefined) as Promise<CartResponse>;
  }

  async clearCart(userId: number | undefined, guestToken: string | undefined): Promise<void> {
    const cart = await this.getOrCreateCart(userId, guestToken);
    await this.cartItemRepo.delete({ cartId: cart.id });
  }

  async mergeCarts(userId: number, guestToken: string): Promise<CartResponse> {
    const guestCart = await this.cartRepo.findOne({
      where: { guestToken },
      relations: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(userId) as Promise<CartResponse>;
    }

    const userCart = await this.getOrCreateCart(userId);

    for (const guestItem of guestCart.items) {
      const whereClause: any = {
        cartId: userCart.id,
        productId: guestItem.productId,
      };
      if (guestItem.colorNameEn) whereClause.colorNameEn = guestItem.colorNameEn;
      if (guestItem.colorHex) whereClause.colorHex = guestItem.colorHex;
      if (guestItem.size) whereClause.size = guestItem.size as ProductSize;

      let userItem = await this.cartItemRepo.findOne({ where: whereClause });

      if (userItem) {
        userItem.quantity += guestItem.quantity;
        await this.cartItemRepo.save(userItem);
      } else {
        const newItem = this.cartItemRepo.create({
          cartId: userCart.id,
          productId: guestItem.productId,
          productName: guestItem.productName,
          unitPrice: guestItem.unitPrice,
          colorNameEn: guestItem.colorNameEn,
          colorNameAr: guestItem.colorNameAr,
          colorHex: guestItem.colorHex,
          size: guestItem.size ? (guestItem.size as ProductSize) : null,
          quantity: guestItem.quantity,
          productImage: guestItem.productImage,
        });
        await this.cartItemRepo.save(newItem);
      }
    }

    await this.cartItemRepo.delete({ cartId: guestCart.id });
    await this.cartRepo.remove(guestCart);

    return this.getCart(userId) as Promise<CartResponse>;
  }

  private async formatCartResponse(cart: Cart): Promise<CartResponse> {
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.productRepo.findOne({
          where: { id: item.productId },
          relations: { colors: true, sizes: true, images: true },
        });

        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          colorNameEn: item.colorNameEn,
          colorNameAr: item.colorNameAr,
          colorHex: item.colorHex,
          size: item.size,
          quantity: item.quantity,
          productImage: item.productImage,
          product: product
            ? {
                id: product.id,
                name: product.name,
                price: product.price,
                mainImageUrl: product.mainImageUrl,
                colors: product.colors?.map((c) => ({
                  id: c.id,
                  nameEn: c.nameEn,
                  nameAr: c.nameAr,
                  hexCode: c.hexCode,
                })) || [],
                sizes: product.sizes?.map((s) => s.size) || [],
              }
            : null,
        };
      })
    );

    const totalItems = itemsWithProducts.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = itemsWithProducts.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      guestToken: cart.guestToken,
      items: itemsWithProducts,
      totalItems,
      totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}

export const CartService = new CartServiceImpl();