import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { OrderStatus } from "../models/enums";
import { PaymentMethod, PaymentStatus } from "../models/enums";
import { toUrlPath } from "../middlewares/upload.middleware";

function getQueryString(req: Request, key: string): string | undefined {
  const val = req.query[key];
  if (Array.isArray(val)) return val[0] as string | undefined;
  if (typeof val === "string") return val;
  return undefined;
}

function getQueryNumber(req: Request, key: string, defaultVal: number): number {
  const val = getQueryString(req, key);
  return val ? Number(val) : defaultVal;
}

// Helper to get proof image URL from uploaded file or body URL
function getProofImageUrl(req: Request): string | null {
  // Check uploaded file (fieldname "proofImage" or "proofImageUrl")
  const files = (req as any).files;
  if (files && Array.isArray(files)) {
    const proofFile = files.find((f: any) => f.fieldname === "proofImage" || f.fieldname === "proofImageUrl");
    if (proofFile) {
      return toUrlPath(proofFile.path);
    }
  }
  // Fallback to body URL
  return req.body.proofImageUrl || null;
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const {
    customerName,
    email,
    phone,
    address,
    city,
    items,
    totalAmount,
    notes,
    // Optional payment fields - if provided, order will be created with payment submitted
    paymentMethod,
    senderName,
    senderAccount,
    senderNumber,
    paymentAmount,
    paymentNotes,
  } = req.body;

  // Get proof image from uploaded file or body URL
  const proofImageUrl = getProofImageUrl(req);

  if (!customerName || !email || !phone || !address || !items || !totalAmount) {
    throw new AppError("Missing required fields: customerName, email, phone, address, items, totalAmount", 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Order must have at least one item", 400);
  }

  // If any payment field is provided, validate all required payment fields
  const hasPaymentFields = paymentMethod || senderName || senderNumber || proofImageUrl || paymentAmount;
  if (hasPaymentFields) {
    if (!paymentMethod || !senderName || !senderNumber || !proofImageUrl || !paymentAmount) {
      throw new AppError("Missing required payment fields: paymentMethod, senderName, senderNumber, proofImageUrl, paymentAmount", 400);
    }
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new AppError("Invalid payment method", 400);
    }
  }

  const userId = req.user?.id as number | undefined;

  const order = await OrderService.createOrder({
    customerName,
    email,
    phone,
    address,
    city,
    items: items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || item.name,
      unitPrice: item.unitPrice || item.price,
      colorId: item.colorId,
      size: item.size,
      quantity: item.quantity || item.qty || 1,
    })),
    totalAmount,
    userId,
    notes,
    // Pass payment data if provided
    paymentData: hasPaymentFields ? {
      paymentMethod,
      senderName,
      senderAccount: senderAccount ?? null,
      senderNumber,
      proofImageUrl: proofImageUrl!,
      amount: paymentAmount,
      notes: paymentNotes,
    } : undefined,
  });

  res.status(201).json({
    success: true,
    message: hasPaymentFields
      ? "Order created with payment submitted successfully. Awaiting admin verification."
      : "Order created successfully. Please proceed to payment.",
    data: {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
    },
    statusCode: 201,
  });
});

export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderNumber = String(req.params.orderNumber);

  const order = await OrderService.getOrderByNumber(orderNumber);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.json({
    success: true,
    message: "Order retrieved successfully",
    data: formatOrderResponse(order),
    statusCode: 200,
  });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.user!.id);
  const status = getQueryString(req, "status") as OrderStatus | undefined;
  const paymentStatus = getQueryString(req, "paymentStatus") as PaymentStatus | undefined;
  const page = getQueryNumber(req, "page", 1);
  const limit = getQueryNumber(req, "limit", 10);

  const result = await OrderService.getUserOrders(userId, {
    status,
    paymentStatus,
    page,
    limit,
  });

  res.json({
    success: true,
    message: "Orders retrieved successfully",
    data: {
      orders: result.data.map(formatOrderResponse),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    },
    statusCode: 200,
  });
});

export const getUserOrderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.user!.id);
  const id = Number(req.params.id);

  const order = await OrderService.getOrderById(id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.userId !== null && order.userId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  res.json({
    success: true,
    message: "Order retrieved successfully",
    data: formatOrderResponse(order),
    statusCode: 200,
  });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const status = getQueryString(req, "status") as OrderStatus | undefined;
  const paymentStatus = getQueryString(req, "paymentStatus") as PaymentStatus | undefined;
  const page = getQueryNumber(req, "page", 1);
  const limit = getQueryNumber(req, "limit", 20);
  const search = getQueryString(req, "search");

  const result = await OrderService.getAllOrders({
    status,
    paymentStatus,
    page,
    limit,
    search,
  });

  res.json({
    success: true,
    message: "Orders retrieved successfully",
    data: {
      orders: result.data.map(formatOrderResponse),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    },
    statusCode: 200,
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const order = await OrderService.getOrderById(id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.json({
    success: true,
    message: "Order retrieved successfully",
    data: formatOrderResponse(order),
    statusCode: 200,
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status, trackingNumber } = req.body;
  const adminId = Number(req.user!.id);

  if (!status || !Object.values(OrderStatus).includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const order = await OrderService.updateOrderStatus(
    id,
    status,
    adminId,
    trackingNumber
  );

  res.json({
    success: true,
    message: "Order status updated successfully",
    data: formatOrderResponse(order),
    statusCode: 200,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { action, rejectionReason } = req.body;
  const adminId = Number(req.user!.id);

  if (!action || !["verify", "reject"].includes(action)) {
    throw new AppError("Invalid action. Must be 'verify' or 'reject'", 400);
  }

  if (action === "reject" && !rejectionReason) {
    throw new AppError("Rejection reason is required when rejecting payment", 400);
  }

  const order = await OrderService.verifyPayment(id, adminId, action, rejectionReason);

  res.json({
    success: true,
    message: `Payment ${action}d successfully`,
    data: formatOrderResponse(order),
    statusCode: 200,
  });
});

export const updateOrderNotes = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { notes } = req.body;

  const order = await OrderService.updateOrderNotes(id, notes);

  res.json({
    success: true,
    message: "Order notes updated successfully",
    data: formatOrderResponse(order),
    statusCode: 200,
  });
});

function formatOrderResponse(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    status: order.status,
    totalAmount: order.totalAmount,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    reviewedAt: order.reviewedAt,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    senderName: order.senderName,
    senderAccount: order.senderAccount,
    senderNumber: order.senderNumber,
    proofImageUrl: order.proofImageUrl,
    paymentAmount: order.paymentAmount,
    paymentNotes: order.paymentNotes,
    paymentSubmittedAt: order.paymentSubmittedAt,
    paymentVerifiedAt: order.paymentVerifiedAt,
    paymentVerifiedBy: order.paymentVerifiedBy,
    rejectionReason: order.rejectionReason,
    items: order.items?.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      colorNameEn: item.colorNameEn,
      colorNameAr: item.colorNameAr,
      colorHex: item.colorHex,
      size: item.size,
      quantity: item.quantity,
    })),
    user: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        }
      : null,
    reviewedByAdmin: order.reviewedByAdmin
      ? {
          id: order.reviewedByAdmin.id,
          name: order.reviewedByAdmin.name,
        }
      : null,
  };
}