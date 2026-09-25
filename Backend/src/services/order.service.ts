import { AppDataSource } from "../config/data-source";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { User } from "../models/User";
import { Admin } from "../models/Admin";
import { OrderStatus } from "../models/enums";
import { PaymentMethod, PaymentStatus } from "../models/enums";
import { AppError } from "../utils/AppError";

interface CreateOrderInput {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  items: Array<{
    productId: number;
    productName: string;
    unitPrice: number;
    colorNameEn?: string;
    colorNameAr?: string;
    colorHex?: string;
    size?: string;
    quantity: number;
  }>;
  totalAmount: number;
  userId?: number;
  notes?: string;
  paymentData?: {
    paymentMethod: PaymentMethod;
    senderName: string;
    senderAccount: string | null;
    senderNumber: string;
    proofImageUrl: string;
    amount: number;
    notes?: string;
  };
}

interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
  search?: string;
  userId?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class OrderServiceImpl {
  private orderRepo = AppDataSource.getRepository(Order);
  private orderItemRepo = AppDataSource.getRepository(OrderItem);
  private userRepo = AppDataSource.getRepository(User);
  private adminRepo = AppDataSource.getRepository(Admin);

  private generateOrderNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `ESIA-${date}-${random}`;
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return AppDataSource.transaction(async (manager) => {
      const orderNumber = this.generateOrderNumber();

      const order = manager.create(Order, {
        orderNumber,
        userId: input.userId ?? null,
        customerName: input.customerName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city ?? null,
        totalAmount: input.totalAmount,
        status: input.paymentData ? OrderStatus.PENDING_PAYMENT : OrderStatus.PENDING,
        notes: input.notes ?? null,
        paymentStatus: input.paymentData ? PaymentStatus.SUBMITTED : PaymentStatus.NOT_SUBMITTED,
        paymentMethod: input.paymentData?.paymentMethod ?? null,
        senderName: input.paymentData?.senderName ?? null,
        senderAccount: input.paymentData?.senderAccount ?? null,
        senderNumber: input.paymentData?.senderNumber ?? null,
        proofImageUrl: input.paymentData?.proofImageUrl ?? null,
        paymentAmount: input.paymentData?.amount ?? null,
        paymentNotes: input.paymentData?.notes ?? null,
        paymentSubmittedAt: input.paymentData ? new Date() : null,
      });

      const savedOrder = await manager.save(order);

      const orderItems = input.items.map((item) => {
        const orderItem = new OrderItem();
        orderItem.orderId = savedOrder.id;
        orderItem.productId = item.productId;
        orderItem.productName = item.productName;
        orderItem.unitPrice = item.unitPrice;
        orderItem.colorNameEn = item.colorNameEn ?? null;
        orderItem.colorNameAr = item.colorNameAr ?? null;
        orderItem.colorHex = item.colorHex ?? null;
        orderItem.size = (item.size as any) ?? null;
        orderItem.quantity = item.quantity;
        return orderItem;
      });

      await manager.save(orderItems);

      const fullOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: { items: true, user: true },
      });

      if (!fullOrder) {
        throw new AppError("Order created but not found", 500);
      }

      return fullOrder;
    });
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { orderNumber },
      relations: { items: true, user: true, reviewedByAdmin: true },
    });
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: { items: true, user: true, reviewedByAdmin: true },
    });
  }

  async getUserOrders(userId: number, filters: OrderFilters = {}): Promise<PaginatedResult<Order>> {
    const { status, paymentStatus, page = 1, limit = 10 } = filters;
    const query = this.orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("order.user", "user")
      .where("order.userId = :userId", { userId });

    if (status) {
      query.andWhere("order.status = :status", { status });
    }
    if (paymentStatus) {
      query.andWhere("order.paymentStatus = :paymentStatus", { paymentStatus });
    }

    query.orderBy("order.createdAt", "DESC");

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllOrders(filters: OrderFilters = {}): Promise<PaginatedResult<Order>> {
    const { status, paymentStatus, page = 1, limit = 20, search } = filters;
    const query = this.orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.reviewedByAdmin", "reviewedByAdmin");

    if (status) {
      query.andWhere("order.status = :status", { status });
    }
    if (paymentStatus) {
      query.andWhere("order.paymentStatus = :paymentStatus", { paymentStatus });
    }

    if (search) {
      query.andWhere(
        "(order.orderNumber ILIKE :search OR order.customerName ILIKE :search OR order.email ILIKE :search OR order.phone ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    query.orderBy("order.createdAt", "DESC");

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    adminId: number,
    trackingNumber?: string
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { items: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PENDING_PAYMENT, OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
      [OrderStatus.REJECTED]: [OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
    }

    order.status = status;
    order.reviewedBy = adminId;
    order.reviewedAt = new Date();

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (status === OrderStatus.ACCEPTED && order.paymentStatus === PaymentStatus.SUBMITTED) {
      order.paymentStatus = PaymentStatus.VERIFIED;
      order.paymentVerifiedAt = new Date();
      order.paymentVerifiedBy = adminId;
    }

    if (status === OrderStatus.REJECTED && order.paymentStatus === PaymentStatus.SUBMITTED) {
      order.paymentStatus = PaymentStatus.REJECTED;
      order.paymentVerifiedAt = new Date();
      order.paymentVerifiedBy = adminId;
    }

    return this.orderRepo.save(order);
  }

  async verifyPayment(orderId: number, adminId: number, action: "verify" | "reject", rejectionReason?: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.paymentStatus !== PaymentStatus.SUBMITTED) {
      throw new AppError("Payment not in submitted status", 400);
    }

    if (action === "verify") {
      order.paymentStatus = PaymentStatus.VERIFIED;
      order.paymentVerifiedAt = new Date();
      order.paymentVerifiedBy = adminId;
      order.rejectionReason = null;
      order.status = OrderStatus.ACCEPTED;
      order.reviewedBy = adminId;
      order.reviewedAt = new Date();
    } else {
      order.paymentStatus = PaymentStatus.REJECTED;
      order.paymentVerifiedAt = new Date();
      order.paymentVerifiedBy = adminId;
      order.rejectionReason = rejectionReason ?? "Payment rejected by admin";
      order.status = OrderStatus.REJECTED;
      order.reviewedBy = adminId;
      order.reviewedAt = new Date();
    }

    return this.orderRepo.save(order);
  }

  async updateOrderNotes(orderId: number, notes: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    order.notes = notes;
    return this.orderRepo.save(order);
  }
}

export const OrderService = new OrderServiceImpl();