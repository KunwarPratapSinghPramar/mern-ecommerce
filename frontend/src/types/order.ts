export type OrderStatus =
  | "payment_pending"
  | "placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AdminOrder {
  _id: string;
  user:
    | {
        _id: string;
        name: string;
        email: string;
      }
    | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  totalPages: number;
}
