// ──────────────────────────────────────────────
// Shared enums (mirror of backend models/enums.ts)
// ──────────────────────────────────────────────
export type UserRole = "user" | "admin";

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "accepted"
  | "rejected"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "not_submitted"
  | "submitted"
  | "verified"
  | "rejected";

export type PaymentMethod = "vodafone_cash";

// ──────────────────────────────────────────────
// API envelope
// ──────────────────────────────────────────────
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export interface AuthUser {
  id: string | number;
  name?: string;
  email: string;
  role: UserRole;
  phone?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiration?: string;
  refreshTokenExpiration?: string;
}

export interface LoginResponse extends AuthTokens {
  deviceId?: string;
  user: AuthUser;
}

// ──────────────────────────────────────────────
// Category
// ──────────────────────────────────────────────
export interface BackendCategory {
  id: number;
  name: string;
  slug: string;
}

// ──────────────────────────────────────────────
// Product
// ──────────────────────────────────────────────
export interface BackendProductColor {
  id: number;
  nameEn: string;
  nameAr: string;
  hexCode: string;
}

export interface BackendProductSize {
  id: number;
  size: string;
  isAvailable: boolean;
}

export interface BackendProductImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
  isMain: boolean;
}

export interface BackendProductCard {
  id: number;
  name: string;
  categoryId: number;
  category: BackendCategory | null;
  price: number;
  oldPrice: number | null;
  tag: string | null;
  isActive: boolean;
  mainImageUrl: string | null;
  mainImage: BackendProductImage | null;
  images: BackendProductImage[];
  colors: BackendProductColor[];
  sizes: BackendProductSize[];
}

export interface BackendProductDetail extends BackendProductCard {
  shortDescription: string | null;
  defaultShape: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Order
// ──────────────────────────────────────────────
export interface BackendOrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  colorNameEn: string | null;
  colorNameAr: string | null;
  colorHex: string | null;
  size: string | null;
  quantity: number;
}

export interface BackendOrder {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  status: OrderStatus;
  totalAmount: number;
  trackingNumber: string | null;
  notes: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  senderName: string | null;
  senderAccount: string | null;
  senderNumber: string | null;
  proofImageUrl: string | null;
  paymentAmount: number | null;
  paymentNotes: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  paymentVerifiedBy: number | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: BackendOrderItem[];
  user: { id: number; name: string; email: string } | null;
  reviewedByAdmin: { id: number; name: string } | null;
}

export interface BackendOrdersPage {
  orders: BackendOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ──────────────────────────────────────────────
// Cart
// ──────────────────────────────────────────────
export interface BackendCartItem {
  id: number;
  productId: number;
  quantity: number;
  colorNameEn: string | null;
  colorNameAr: string | null;
  colorHex: string | null;
  size: string | null;
}

export interface BackendCart {
  id: number;
  items: BackendCartItem[];
}
