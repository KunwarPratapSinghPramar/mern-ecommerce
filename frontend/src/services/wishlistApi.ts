import api from "./api";
import type { Product } from "../types/product";

export interface WishlistResponse {
  items: Product[];
}

export const getWishlist = async (): Promise<WishlistResponse> => {
  const response = await api.get<WishlistResponse>("/wishlist");
  return response.data;
};

export const addWishlistItem = async (
  productId: string,
): Promise<WishlistResponse> => {
  const response = await api.post<WishlistResponse>(
    `/wishlist/items/${productId}`,
  );
  return response.data;
};

export const removeWishlistItem = async (
  productId: string,
): Promise<WishlistResponse> => {
  const response = await api.delete<WishlistResponse>(
    `/wishlist/items/${productId}`,
  );
  return response.data;
};
