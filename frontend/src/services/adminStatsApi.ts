
import api from "./api";

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>("/admin/stats");
  return response.data;
};
