import api from "./api";
import type {
  AdminOrder,
  AdminOrderResponse,
  OrderStatus,
} from "../types/order";

export interface GetAdminOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
}

export const getAdminOrders = async (
  params: GetAdminOrdersParams = {},
): Promise<AdminOrderResponse> => {
  const response = await api.get("/admin/orders", { params });
  return response.data;
};

export const getAdminOrderById = async (id: string): Promise<AdminOrder> => {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data.order ?? response.data;
};

export const updateAdminOrderStatus = async (
  id: string,
  status: OrderStatus,
): Promise<AdminOrder> => {
  const response = await api.patch(`/admin/orders/${id}/status`, {
    status,
  });

  return response.data.order ?? response.data;
};

export const cancelAdminOrder = async (
  id: string,
  reason: string,
): Promise<AdminOrder> => {
  const response = await api.patch(`/admin/orders/${id}/cancel`, {
    reason,
  });

  return response.data.order ?? response.data;
};

export const markCodOrderPaid = async (id: string): Promise<AdminOrder> => {
  const response = await api.patch(`/admin/orders/${id}/mark-cod-paid`);

  return response.data.order ?? response.data;
};
