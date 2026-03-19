export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  UNPAID = "unpaid",
  PENDING_VERIFICATION = "pending_verification",
  PAID = "paid",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  MOBILE_MONEY = "mobile_money",
}

export enum InvoiceStatus {
  UNPAID = "unpaid",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export interface Invoice {
  id: number;
  orderId: number;
  number: string;
  status: InvoiceStatus;
  issuedAt: string;
}

export interface Receipt {
  id: number;
  orderId: number;
  number: string;
  paidAt: string;
  paymentMethod: PaymentMethod;
}

export interface OrderWorkflowModel {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  invoice?: Invoice | null;
  receipt?: Receipt | null;
}

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};
