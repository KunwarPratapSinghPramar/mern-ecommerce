import api from "./api";
import type { CartResponse } from "../types/cart";

export const getCart = async (): Promise<CartResponse> => {
  const response = await api.get<CartResponse>("/cart");
  return response.data;
};

export const addCartItem = async (
  productId: string,
  quantity: number,
): Promise<void> => {
  await api.post("/cart/items", { productId, quantity });
};

export const updateCartItem = async (
  productId: string,
  quantity: number,
): Promise<void> => {
  await api.patch(`/cart/items/${productId}`, { quantity });
};

export const removeCartItem = async (productId: string): Promise<void> => {
  await api.delete(`/cart/items/${productId}`);
};

export const clearCart = async (): Promise<void> => {
  await api.delete("/cart");
};
