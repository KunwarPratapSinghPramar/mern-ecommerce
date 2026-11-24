export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  owner?:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      };
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMovement {
  _id: string;
  type: "initial" | "adjustment" | "sale" | "cancellation" | "return";
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  createdAt: string;
  changedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export type ProductInput = Omit<
  Product,
  "_id" | "createdAt" | "updatedAt" | "owner"
>;
