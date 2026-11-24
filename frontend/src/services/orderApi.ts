import api from "./api";
import type { AdminOrder } from "../types/order";

interface MyOrdersResponse {
  orders: AdminOrder[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export const getMyOrders = async (): Promise<AdminOrder[]> => {
  const response = await api.get<MyOrdersResponse | AdminOrder[]>(
    "/orders/my-orders",
  );

  return Array.isArray(response.data) ? response.data : response.data.orders;
};

export const getMyOrderById = async (id: string): Promise<AdminOrder> => {
  const response = await api.get<{ order: AdminOrder } | AdminOrder>(
    `/orders/${id}`,
  );

  return "order" in response.data ? response.data.order : response.data;
};
