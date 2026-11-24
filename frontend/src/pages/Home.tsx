// import { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// // import { getProducts } from "../services/productApi";
// import {
//   getProducts,
//   getProductCategories,
//   type ProductPagination,
// } from "../services/productApi";
// import { addCartItem } from "../services/cartApi";
// import { useAuth } from "../context/useAuth";
// import type { Product } from "../types/product";
// import WishlistButton from "../components/WishlistButton";

// export default function Home() {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [products, setProducts] = useState<Product[]>([]);
//   // const [search, setSearch] = useState("");
//   // const [category, setCategory] = useState("All");
//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState("All");
//   const [minPrice, setMinPrice] = useState("");
//   const [maxPrice, setMaxPrice] = useState("");
//   const [sort, setSort] = useState("newest");
//   const [categories, setCategories] = useState<string[]>([]);
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState<ProductPagination>({
//     total: 0,
//     page: 1,
//     limit: 12,
//     totalPages: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [addingId, setAddingId] = useState<string | null>(null);
//   const [message, setMessage] = useState("");

//   const isCustomer = user?.role === "user";

//   // useEffect(() => {
//   //   const loadProducts = async () => {
//   //     try {
//   //       setLoading(true);
//   //       setError("");
//   //       const result = await getProducts();
//   //       setProducts(result);
//   //     } catch {
//   //       setError("Unable to load products. Please try again.");
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   void loadProducts();
//   // }, []);

//   useEffect(() => {
//     let active = true;

//     const loadProducts = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const result = await getProducts({
//           search,
//           category,
//           minPrice,
//           maxPrice,
//           sort,
//           page,
//           limit: 12,
//         });

//         if (active) {
//           setProducts(result.products);
//           setPagination(result.pagination);
//         }
//       } catch {
//         if (active) {
//           setError("Unable to load products. Please try again.");
//         }
//       } finally {
//         if (active) {
//           setLoading(false);
//         }
//       }
//     };

//     void loadProducts();

//     return () => {
//       active = false;
//     };
//   }, [search, category, minPrice, maxPrice, sort, page]);

//   useEffect(() => {
//     let active = true;

//     const loadCategories = async () => {
//       try {
//         const result = await getProductCategories();

//         if (active) {
//           setCategories(result);
//         }
//       } catch {
//         // Category loading should not prevent product browsing.
//       }
//     };

//     void loadCategories();

//     return () => {
//       active = false;
//     };
//   }, []);

//   // const categories = useMemo(
//   //   () => ["All", ...new Set(products.map((product) => product.category))],
//   //   [products],
//   // );

//   // const filteredProducts = useMemo(() => {
//   //   const term = search.trim().toLowerCase();

//   //   return products.filter((product) => {
//   //     const matchesCategory =
//   //       category === "All" || product.category === category;

//   //     const matchesSearch =
//   //       !term ||
//   //       product.name.toLowerCase().includes(term) ||
//   //       product.brand.toLowerCase().includes(term) ||
//   //       product.category.toLowerCase().includes(term);

//   //     return matchesCategory && matchesSearch;
//   //   });
//   // }, [products, search, category]);

//   const featuredProducts = products.filter((product) => product.isFeatured);

//   const handleAddToCart = async (product: Product) => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     if (!isCustomer) return;

//     try {
//       setAddingId(product._id);
//       setMessage("");

//       await addCartItem(product._id, 1);
//       window.dispatchEvent(new Event("cart-updated"));
//       setMessage(`${product.name} added to your cart.`);
//     } catch (err: unknown) {
//       const errorMessage =
//         err instanceof Error ? err.message : "Unable to add this product.";
//       setMessage(errorMessage);
//     } finally {
//       setAddingId(null);
//     }
//   };

//   const formatPrice = (price: number) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       maximumFractionDigits: 2,
//     }).format(price);

//   return (
//     <main>
//       <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
//         <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
//           <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">
//             Welcome to MERN Store
//           </p>

//           <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
//             Find the products you love.
//           </h1>

//           <p className="mt-4 max-w-xl text-blue-100">
//             Explore our collection and discover featured products.
//           </p>

//           {isCustomer && (
//             <a
//               href="#products"
//               className="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
//             >
//               Shop Now
//             </a>
//           )}
//         </div>
//       </section>

//       <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
//         {featuredProducts.length > 0 && (
//           <div className="mb-12">
//             <div className="mb-5 flex items-center justify-between">
//               <h2 className="text-2xl font-bold">Featured Products</h2>
//               <a
//                 href="#products"
//                 className="text-sm font-semibold text-blue-700"
//               >
//                 View all products
//               </a>
//             </div>

//             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//               {featuredProducts.slice(0, 4).map((product) => (
//                 <ProductCard
//                   key={product._id}
//                   product={product}
//                   formatPrice={formatPrice}
//                   adding={addingId === product._id}
//                   onAdd={() => void handleAddToCart(product)}
//                   canShop={isCustomer}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         <div id="products" className="scroll-mt-24">
//           <div className="mb-6">
//             <h2 className="text-2xl font-bold">Our Products</h2>
//             <p className="mt-1 text-gray-500">
//               Browse our complete product collection.
//             </p>
//           </div>

//           {/* <div className="mb-6 flex flex-col gap-3 sm:flex-row">
//             <input
//               type="search"
//               value={search}
//               onChange={(event) => setSearch(event.target.value)}
//               placeholder="Search products, brands or categories..."
//               className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 sm:flex-1"
//             />

//             <select
//               value={category}
//               onChange={(event) => setCategory(event.target.value)}
//               className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
//             >
//               {categories.map((item) => (
//                 <option key={item} value={item}>
//                   {item === "All" ? "All Categories" : item}
//                 </option>
//               ))}
//             </select>
//           </div> */}

//           <div className="mb-6 space-y-4">
//             <div className="flex flex-col gap-3 sm:flex-row">
//               <input
//                 type="search"
//                 value={search}
//                 onChange={(event) => {
//                   setSearch(event.target.value);
//                   setPage(1);
//                 }}
//                 placeholder="Search products, brands or descriptions..."
//                 className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 sm:flex-1"
//               />

//               <select
//                 value={category}
//                 onChange={(event) => {
//                   setCategory(event.target.value);
//                   setPage(1);
//                 }}
//                 className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
//               >
//                 <option value="All">All Categories</option>
//                 {categories.map((item) => (
//                   <option key={item} value={item}>
//                     {item}
//                   </option>
//                 ))}
//               </select>

//               <select
//                 value={sort}
//                 onChange={(event) => {
//                   setSort(event.target.value);
//                   setPage(1);
//                 }}
//                 className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
//               >
//                 <option value="newest">Newest First</option>
//                 <option value="price-low">Price: Low to High</option>
//                 <option value="price-high">Price: High to Low</option>
//               </select>
//             </div>

//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//               <input
//                 type="number"
//                 min="0"
//                 value={minPrice}
//                 onChange={(event) => {
//                   setMinPrice(event.target.value);
//                   setPage(1);
//                 }}
//                 placeholder="Minimum price (₹)"
//                 className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
//               />

//               <input
//                 type="number"
//                 min="0"
//                 value={maxPrice}
//                 onChange={(event) => {
//                   setMaxPrice(event.target.value);
//                   setPage(1);
//                 }}
//                 placeholder="Maximum price (₹)"
//                 className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
//               />

//               <button
//                 type="button"
//                 onClick={() => {
//                   setSearch("");
//                   setCategory("All");
//                   setMinPrice("");
//                   setMaxPrice("");
//                   setSort("newest");
//                   setPage(1);
//                 }}
//                 className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
//               >
//                 Clear Filters
//               </button>
//             </div>
//           </div>

//           {message && (
//             <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
//               {message}
//             </p>
//           )}

//           {loading ? (
//             <p className="py-12 text-center text-gray-500">
//               Loading products...
//             </p>
//           ) : error ? (
//             <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
//           ) : products.length === 0 ? (
//             <p className="rounded-lg bg-white p-10 text-center text-gray-500 shadow-sm">
//               No products found. Try another search or category.
//             </p>
//           ) : (
//             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//               {products.map((product) => (
//                 <ProductCard
//                   key={product._id}
//                   product={product}
//                   formatPrice={formatPrice}
//                   adding={addingId === product._id}
//                   onAdd={() => void handleAddToCart(product)}
//                   canShop={isCustomer}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </section>
//     </main>
//   );
// }

// interface ProductCardProps {
//   product: Product;
//   formatPrice: (price: number) => string;
//   adding: boolean;
//   onAdd: () => void;
//   canShop: boolean;
// }

// function ProductCard({
//   product,
//   formatPrice,
//   adding,
//   onAdd,
//   canShop,
// }: ProductCardProps) {
//   return (
//     <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
//       <Link to={`/products/${product._id}`} className="block">
//         <div className="flex h-56 items-center justify-center bg-gray-100">
//           {product.images?.[0] ? (
//             <img
//               src={product.images[0]}
//               alt={product.name}
//               className="h-full w-full object-contain"
//             />
//           ) : (
//             <span className="text-sm text-gray-400">No product image</span>
//           )}
//         </div>

//         <div className="p-4">
//           <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
//             {product.category}
//           </p>

//           <h3 className="mt-1 line-clamp-2 min-h-12 font-semibold text-gray-900">
//             {product.name}
//           </h3>

//           <p className="mt-1 text-sm text-gray-500">{product.brand}</p>

//           <p className="mt-3 text-lg font-bold text-gray-900">
//             {formatPrice(product.price)}
//           </p>

//           <p
//             className={`mt-1 text-xs ${
//               product.stock > 0 ? "text-green-700" : "text-red-600"
//             }`}
//           >
//             {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
//           </p>
//         </div>
//       </Link>

//       {/* {canShop && (
//         <div className="px-4 pb-4">
//           <button
//             type="button"
//             onClick={onAdd}
//             disabled={adding || product.stock <= 0}
//             className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
//           >
//             {adding
//               ? "Adding..."
//               : product.stock <= 0
//                 ? "Out of Stock"
//                 : "Add to Cart"}
//           </button>
//         </div>
//       )} */}
//       {canShop && (
//         <div className="px-4 pb-4 space-y-2">
//           <button
//             type="button"
//             onClick={onAdd}
//             disabled={adding || product.stock <= 0}
//             className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
//           >
//             {adding
//               ? "Adding..."
//               : product.stock <= 0
//                 ? "Out of Stock"
//                 : "Add to Cart"}
//           </button>

//           <WishlistButton productId={product._id} />
//         </div>
//       )}
//     </article>
//   );
// }

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getProducts,
  getProductCategories,
  type ProductPagination,
} from "../services/productApi";

import { addCartItem } from "../services/cartApi";
import { useAuth } from "../context/useAuth";
import type { Product } from "../types/product";
import WishlistButton from "../components/WishlistButton";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<ProductPagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const isCustomer = user?.role === "user";

  // Load products whenever a filter or page changes.
  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getProducts({
          search,
          category,
          minPrice,
          maxPrice,
          sort,
          page,
          limit: 12,
        });

        if (active) {
          setProducts(result.products);
          setPagination(result.pagination);
        }
      } catch {
        if (active) {
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, [search, category, minPrice, maxPrice, sort, page]);

  // Load all available categories independently of the current page.
  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const result = await getProductCategories();

        if (active) {
          setCategories(result);
        }
      } catch {
        // Category loading should not prevent product browsing.
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = products.filter((product) => product.isFeatured);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isCustomer) return;

    try {
      setAddingId(product._id);
      setMessage("");

      await addCartItem(product._id, 1);
      window.dispatchEvent(new Event("cart-updated"));

      setMessage(`${product.name} added to your cart.`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to add this product.";

      setMessage(errorMessage);
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);

  return (
    <main>
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">
            Welcome to MERN Store
          </p>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Find the products you love.
          </h1>

          <p className="mt-4 max-w-xl text-blue-100">
            Explore our collection and discover featured products.
          </p>

          {isCustomer && (
            <a
              href="#products"
              className="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Shop Now
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Featured Products</h2>

              <a
                href="#products"
                className="text-sm font-semibold text-blue-700"
              >
                View all products
              </a>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  formatPrice={formatPrice}
                  adding={addingId === product._id}
                  onAdd={() => void handleAddToCart(product)}
                  canShop={isCustomer}
                />
              ))}
            </div>
          </div>
        )}

        <div id="products" className="scroll-mt-24">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Our Products</h2>
            <p className="mt-1 text-gray-500">
              Browse our complete product collection.
            </p>
          </div>

          {/* Search, category and sorting filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search products, brands or descriptions..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 sm:flex-1"
              />

              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">All Categories</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Price range filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => {
                  setMinPrice(event.target.value);
                  setPage(1);
                }}
                placeholder="Minimum price (₹)"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(event.target.value);
                  setPage(1);
                }}
                placeholder="Maximum price (₹)"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setMinPrice("");
                  setMaxPrice("");
                  setSort("newest");
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {message && (
            <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              {message}
            </p>
          )}

          {loading ? (
            <p className="py-12 text-center text-gray-500">
              Loading products...
            </p>
          ) : error ? (
            <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
          ) : products.length === 0 ? (
            <p className="rounded-lg bg-white p-10 text-center text-gray-500 shadow-sm">
              No products found. Try another search or category.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    formatPrice={formatPrice}
                    adding={addingId === product._id}
                    onAdd={() => void handleAddToCart(product)}
                    canShop={isCustomer}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} products)
                  </span>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

interface ProductCardProps {
  product: Product;
  formatPrice: (price: number) => string;
  adding: boolean;
  onAdd: () => void;
  canShop: boolean;
}

function ProductCard({
  product,
  formatPrice,
  adding,
  onAdd,
  canShop,
}: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/products/${product._id}`} className="block">
        <div className="flex h-56 items-center justify-center bg-gray-100">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-sm text-gray-400">No product image</span>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {product.category}
          </p>

          <h3 className="mt-1 line-clamp-2 min-h-12 font-semibold text-gray-900">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">{product.brand}</p>

          <p className="mt-3 text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </p>

          <p
            className={`mt-1 text-xs ${
              product.stock > 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
        </div>
      </Link>

      {canShop && (
        <div className="space-y-2 px-4 pb-4">
          <button
            type="button"
            onClick={onAdd}
            disabled={adding || product.stock <= 0}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {adding
              ? "Adding..."
              : product.stock <= 0
                ? "Out of Stock"
                : "Add to Cart"}
          </button>

          <WishlistButton productId={product._id} />
        </div>
      )}
    </article>
  );
}
