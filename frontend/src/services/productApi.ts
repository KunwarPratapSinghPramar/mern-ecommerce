import api from "./api";
import type {
  InventoryMovement,
  Product,
  ProductInput,
} from "../types/product";

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilteredProductsResponse {
  products: Product[];
  pagination: ProductPagination;
}

const extractProduct = (data: Product | ProductResponse): Product => {
  if ("_id" in data) {
    return data;
  }

  if (data.product) {
    return data.product;
  }

  throw new Error("Invalid product response from server");
};

// interface ProductListResponse {
//   products?: Product[];
//   data?: Product[];
//   pagination?: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

interface ProductResponse {
  product?: Product;
}

interface HistoryResponse {
  product: Pick<Product, "_id" | "name" | "stock">;
  movements: InventoryMovement[];
}

interface UploadResponse {
  message: string;
  images: {
    secure_url: string;
    public_id: string;
  }[];
}

// export const getProducts = async (): Promise<Product[]> => {
//   const allProducts: Product[] = [];
//   const limit = 50;
//   let page = 1;
//   let totalPages = 1;

//   do {
//     const response = await api.get<ProductListResponse>("/products", {
//       params: { page, limit },
//     });

//     const batch = response.data.products ?? response.data.data ?? [];

//     allProducts.push(...batch);

//     totalPages = response.data.pagination?.totalPages ?? 1;

//     if (batch.length === 0) break;

//     page += 1;
//   } while (page <= totalPages);

//   return allProducts;
// };

export const getProducts = async (
  filters: ProductFilters = {},
): Promise<FilteredProductsResponse> => {
  const response = await api.get<FilteredProductsResponse>("/products", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
      search: filters.search || undefined,
      category:
        filters.category && filters.category !== "All"
          ? filters.category
          : undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      sort: filters.sort || "newest",
    },
  });

  return response.data;
};

export const getProductCategories = async (): Promise<string[]> => {
  const response = await api.get<{ categories: string[] }>(
    "/products/categories",
  );

  return response.data.categories;
};

export const getManagedProducts = async () => {
  const firstResponse = await api.get("/products/mine?page=1&limit=50");
  const firstData = firstResponse.data;

  const products = [...firstData.products];
  const totalPages = firstData.pagination?.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await api.get(`/products/mine?page=${page}&limit=50`);
    products.push(...response.data.products);
  }

  return products;
};

export const createProduct = async (
  product: ProductInput,
): Promise<Product> => {
  const response = await api.post<ProductResponse | Product>(
    "/products",
    product,
  );

  //   return "product" in response.data ? response.data.product! : response.data;
  return extractProduct(response.data);
};

export const updateProduct = async (
  id: string,
  product: Partial<ProductInput>,
): Promise<Product> => {
  const response = await api.put<ProductResponse | Product>(
    `/products/${id}`,
    product,
  );

  //   return "product" in response.data ? response.data.product! : response.data;
  return extractProduct(response.data);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const uploadProductImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await api.post<UploadResponse>("/uploads/images", formData);

  return response.data.images.map((image) => image.secure_url);
};

export const adjustStock = async (
  productId: string,
  quantityChange: number,
  reason: string,
  notes?: string,
) => {
  const response = await api.patch(`/inventory/${productId}/adjust`, {
    quantityChange,
    reason,
    notes,
  });

  return response.data;
};

export const getInventoryHistory = async (
  productId: string,
): Promise<HistoryResponse> => {
  const response = await api.get<HistoryResponse>(
    `/inventory/${productId}/history`,
  );

  return response.data;
};
