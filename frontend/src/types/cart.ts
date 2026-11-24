export interface CartProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}
