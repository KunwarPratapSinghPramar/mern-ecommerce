import api from "./api";
import type { AdminOrder } from "../types/order";

export interface SalesOrdersResponse {
  orders: AdminOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getSalesOrders = async (
  page = 1,
): Promise<SalesOrdersResponse> => {
  const response = await api.get(`/sales/orders?page=${page}&limit=10`);

  return response.data;
};
