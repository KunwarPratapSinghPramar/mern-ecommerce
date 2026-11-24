const swaggerDocument = {
  openapi: "3.0.3",

  info: {
    title: "MERN E-Commerce API",
    version: "1.0.0",
    description:
      "Interactive API documentation for the MERN E-Commerce application. Protected endpoints require a JWT bearer token.",
  },

  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local development server",
    },
  ],

  tags: [
    { name: "Authentication" },
    { name: "Products" },
    { name: "Cart" },
    { name: "Wishlist" },
    { name: "Orders" },
    { name: "Payments" },
    { name: "Salesperson" },
    { name: "Admin" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token without the Bearer prefix.",
      },
    },

    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Test Customer" },
          email: {
            type: "string",
            format: "email",
            example: "customer@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Customer123",
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "customer@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "Customer123",
          },
        },
      },

      Product: {
        type: "object",
        properties: {
          _id: { type: "string", example: "665abc123456789012345678" },
          name: { type: "string", example: "Wireless Headphones" },
          description: { type: "string", example: "Bluetooth headphones" },
          price: { type: "number", example: 1999 },
          category: { type: "string", example: "Electronics" },
          brand: { type: "string", example: "Demo Brand" },
          stock: { type: "integer", example: 20 },
          image: {
            type: "string",
            example:
              "https://res.cloudinary.com/example/image/upload/sample.jpg",
          },
        },
      },

      ProductRequest: {
        type: "object",
        required: ["name", "description", "price", "category"],
        properties: {
          name: { type: "string", example: "Wireless Headphones" },
          description: { type: "string", example: "Bluetooth headphones" },
          price: { type: "number", example: 1999 },
          category: { type: "string", example: "Electronics" },
          brand: { type: "string", example: "Demo Brand" },
          stock: { type: "integer", example: 20 },
        },
      },

      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Something went wrong" },
        },
      },
    },
  },

  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a customer account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Customer registered successfully" },
          "400": { description: "Invalid registration data" },
          "409": { description: "Account already exists" },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
        },
      },
    },

    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the currently authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user returned" },
          "401": { description: "Authentication required" },
        },
      },
    },

    "/products": {
      get: {
        tags: ["Products"],
        summary: "Get products with optional filters",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "price-low", "price-high"],
            },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 12 },
          },
        ],
        responses: {
          "200": {
            description: "Products returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" },
                    },
                    pagination: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },

      post: {
        tags: ["Products"],
        summary: "Create a product",
        description:
          "Available to admins and salespeople. Salespeople create products under their ownership.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Product created" },
          "401": { description: "Authentication required" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },

    "/products/categories": {
      get: {
        tags: ["Products"],
        summary: "Get available product categories",
        responses: {
          "200": { description: "Categories returned" },
        },
      },
    },

    "/products/mine": {
      get: {
        tags: ["Products"],
        summary: "Get products managed by the current user",
        description:
          "Admins can view all managed products; salespeople see their own products.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Managed products returned" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },

    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product details",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Product returned" },
          "404": { description: "Product not found" },
        },
      },

      put: {
        tags: ["Products"],
        summary: "Update a product",
        description:
          "Admins can update any product. Salespeople can update only their own products.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Product updated" },
          "403": { description: "Not allowed to update this product" },
          "404": { description: "Product not found" },
        },
      },

      delete: {
        tags: ["Products"],
        summary: "Delete a product",
        description:
          "Admins can delete any product. Salespeople can delete only their own products.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Product deleted" },
          "403": { description: "Not allowed to delete this product" },
          "404": { description: "Product not found" },
        },
      },
    },

    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get the current customer's cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cart returned" },
          "401": { description: "Authentication required" },
        },
      },

      post: {
        tags: ["Cart"],
        summary: "Add an item to the cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Cart updated" },
          "201": { description: "Item added" },
          "400": { description: "Invalid cart request" },
        },
      },

      delete: {
        tags: ["Cart"],
        summary: "Clear the current customer's cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cart cleared" },
        },
      },
    },

    "/cart/{productId}": {
      put: {
        tags: ["Cart"],
        summary: "Update cart item quantity",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  quantity: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Cart item updated" },
        },
      },

      delete: {
        tags: ["Cart"],
        summary: "Remove an item from the cart",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Cart item removed" },
        },
      },
    },

    "/wishlist": {
      get: {
        tags: ["Wishlist"],
        summary: "Get the current customer's wishlist",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Wishlist returned" },
        },
      },

      post: {
        tags: ["Wishlist"],
        summary: "Add a product to the wishlist",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Wishlist updated" },
          "201": { description: "Product added" },
        },
      },
    },

    "/wishlist/{productId}": {
      delete: {
        tags: ["Wishlist"],
        summary: "Remove a product from the wishlist",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Product removed" },
        },
      },
    },

    "/orders/my": {
      get: {
        tags: ["Orders"],
        summary: "Get the current customer's orders",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Customer orders returned" },
        },
      },
    },

    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order details",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Order details returned" },
          "403": { description: "Not allowed to access this order" },
          "404": { description: "Order not found" },
        },
      },
    },

    "/sales/orders": {
      get: {
        tags: ["Salesperson"],
        summary: "Get orders containing the salesperson's products",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Salesperson orders returned" },
          "403": { description: "Salesperson access required" },
        },
      },
    },

    "/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get admin sales statistics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Statistics returned" },
          "403": { description: "Admin access required" },
        },
      },
    },

    "/admin/orders": {
      get: {
        tags: ["Admin"],
        summary: "Get all orders",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Orders returned" },
          "403": { description: "Admin access required" },
        },
      },
    },

    "/payment/create-order": {
      post: {
        tags: ["Payments"],
        summary: "Create a Razorpay payment order",
        description:
          "Creates a payment order through the backend using Razorpay test or production credentials.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Payment order created" },
          "201": { description: "Payment order created" },
          "400": { description: "Invalid payment request" },
          "401": { description: "Authentication required" },
        },
      },
    },

    "/payment/verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify Razorpay payment",
        description:
          "Verifies the Razorpay payment signature on the backend. The order must not be treated as paid without successful server-side verification.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Payment verification completed" },
          "400": { description: "Payment verification failed" },
          "401": { description: "Authentication required" },
        },
      },
    },
  },
};

export default swaggerDocument;
