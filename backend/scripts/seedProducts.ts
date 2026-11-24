import "dotenv/config";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  isFeatured: boolean;
}

const products: SeedProduct[] = [
  // ELECTRONICS
  {
    name: "Wireless Bluetooth Headphones",
    description:
      "Over-ear wireless headphones with deep bass, clear sound and comfortable ear cushions.",
    price: 2499,
    category: "Electronics",
    brand: "SoundMax",
    stock: 35,
    isFeatured: true,
  },
  {
    name: "Smart Watch Series X",
    description:
      "Smart watch with fitness tracking, heart rate monitoring and notification support.",
    price: 3999,
    category: "Electronics",
    brand: "TechPro",
    stock: 20,
    isFeatured: true,
  },
  {
    name: "Wireless Gaming Mouse",
    description:
      "Ergonomic wireless gaming mouse with adjustable DPI and programmable buttons.",
    price: 1299,
    category: "Electronics",
    brand: "GameZone",
    stock: 40,
    isFeatured: false,
  },
  {
    name: "Mechanical Gaming Keyboard",
    description: "Mechanical keyboard with tactile switches and RGB lighting.",
    price: 2799,
    category: "Electronics",
    brand: "GameZone",
    stock: 25,
    isFeatured: true,
  },
  {
    name: "Portable Bluetooth Speaker",
    description:
      "Portable speaker with powerful sound and rechargeable battery.",
    price: 1799,
    category: "Electronics",
    brand: "SoundMax",
    stock: 30,
    isFeatured: false,
  },
  {
    name: "USB-C Fast Charger",
    description:
      "Fast charging USB-C adapter for compatible smartphones and tablets.",
    price: 899,
    category: "Electronics",
    brand: "ChargePro",
    stock: 60,
    isFeatured: false,
  },
  {
    name: "Wireless Earbuds Pro",
    description:
      "Compact wireless earbuds with charging case and noise reduction.",
    price: 2199,
    category: "Electronics",
    brand: "SoundMax",
    stock: 32,
    isFeatured: true,
  },
  {
    name: "Laptop Backpack",
    description: "Padded laptop backpack with multiple storage compartments.",
    price: 1599,
    category: "Electronics",
    brand: "TechPro",
    stock: 28,
    isFeatured: false,
  },
  {
    name: "Full HD Webcam",
    description: "Full HD webcam suitable for online meetings and video calls.",
    price: 1899,
    category: "Electronics",
    brand: "ViewTech",
    stock: 18,
    isFeatured: false,
  },
  {
    name: "Portable Power Bank",
    description: "High-capacity portable power bank with USB charging ports.",
    price: 1499,
    category: "Electronics",
    brand: "ChargePro",
    stock: 45,
    isFeatured: true,
  },

  // FASHION
  {
    name: "Men's Casual Cotton T-Shirt",
    description: "Comfortable regular-fit cotton T-shirt for everyday wear.",
    price: 599,
    category: "Fashion",
    brand: "UrbanWear",
    stock: 50,
    isFeatured: true,
  },
  {
    name: "Men's Slim Fit Jeans",
    description: "Modern slim-fit denim jeans with comfortable stretch fabric.",
    price: 1499,
    category: "Fashion",
    brand: "DenimCo",
    stock: 30,
    isFeatured: false,
  },
  {
    name: "Women's Casual Handbag",
    description: "Stylish everyday handbag with spacious compartments.",
    price: 1899,
    category: "Fashion",
    brand: "StyleCraft",
    stock: 18,
    isFeatured: true,
  },
  {
    name: "Women's Running Shoes",
    description: "Lightweight running shoes with cushioned soles.",
    price: 2299,
    category: "Fashion",
    brand: "ActiveStep",
    stock: 22,
    isFeatured: false,
  },
  {
    name: "Men's Casual Hoodie",
    description:
      "Soft cotton-blend hoodie suitable for casual everyday outfits.",
    price: 1299,
    category: "Fashion",
    brand: "UrbanWear",
    stock: 26,
    isFeatured: false,
  },
  {
    name: "Women's Denim Jacket",
    description: "Classic denim jacket with a modern fit.",
    price: 1999,
    category: "Fashion",
    brand: "DenimCo",
    stock: 16,
    isFeatured: true,
  },
  {
    name: "Classic White Sneakers",
    description: "Minimal white sneakers suitable for casual outfits.",
    price: 1799,
    category: "Fashion",
    brand: "ActiveStep",
    stock: 24,
    isFeatured: false,
  },
  {
    name: "Women's Summer Dress",
    description: "Lightweight casual summer dress with a comfortable fit.",
    price: 1199,
    category: "Fashion",
    brand: "StyleCraft",
    stock: 20,
    isFeatured: false,
  },
  {
    name: "Men's Formal Shirt",
    description:
      "Smart formal shirt suitable for office and special occasions.",
    price: 999,
    category: "Fashion",
    brand: "UrbanWear",
    stock: 34,
    isFeatured: false,
  },
  {
    name: "Casual Sports Shoes",
    description: "Comfortable everyday sports shoes with flexible soles.",
    price: 1599,
    category: "Fashion",
    brand: "ActiveStep",
    stock: 29,
    isFeatured: true,
  },

  // HOME & KITCHEN
  {
    name: "Stainless Steel Water Bottle",
    description: "Reusable insulated water bottle for everyday use.",
    price: 699,
    category: "Home & Kitchen",
    brand: "HomeEssentials",
    stock: 55,
    isFeatured: false,
  },
  {
    name: "Ceramic Coffee Mug Set",
    description: "Set of two ceramic coffee mugs for home and office.",
    price: 499,
    category: "Home & Kitchen",
    brand: "HomeEssentials",
    stock: 40,
    isFeatured: false,
  },
  {
    name: "Non-Stick Cookware Set",
    description: "Practical non-stick cookware set for everyday cooking.",
    price: 2499,
    category: "Home & Kitchen",
    brand: "KitchenPro",
    stock: 12,
    isFeatured: true,
  },
  {
    name: "LED Desk Lamp",
    description: "Adjustable LED desk lamp with multiple brightness settings.",
    price: 1199,
    category: "Home & Kitchen",
    brand: "BrightHome",
    stock: 28,
    isFeatured: false,
  },
  {
    name: "Modern Table Clock",
    description: "Minimalist table clock for bedroom and office decoration.",
    price: 799,
    category: "Home & Kitchen",
    brand: "BrightHome",
    stock: 22,
    isFeatured: false,
  },
  {
    name: "Decorative Cushion Set",
    description: "Set of decorative cushions for sofas and living rooms.",
    price: 999,
    category: "Home & Kitchen",
    brand: "HomeEssentials",
    stock: 30,
    isFeatured: true,
  },
  {
    name: "Kitchen Storage Containers",
    description:
      "Reusable airtight containers for organizing kitchen essentials.",
    price: 599,
    category: "Home & Kitchen",
    brand: "KitchenPro",
    stock: 45,
    isFeatured: false,
  },
  {
    name: "Modern Wall Art",
    description: "Decorative wall art for modern living spaces.",
    price: 899,
    category: "Home & Kitchen",
    brand: "DecorPlus",
    stock: 15,
    isFeatured: false,
  },
  {
    name: "Soft Cotton Bedsheet",
    description: "Comfortable cotton bedsheet set for everyday bedroom use.",
    price: 1499,
    category: "Home & Kitchen",
    brand: "HomeEssentials",
    stock: 20,
    isFeatured: true,
  },
  {
    name: "Electric Coffee Maker",
    description: "Compact electric coffee maker for convenient home brewing.",
    price: 2999,
    category: "Home & Kitchen",
    brand: "KitchenPro",
    stock: 10,
    isFeatured: false,
  },

  // ACCESSORIES
  {
    name: "Classic Analog Wrist Watch",
    description: "Elegant analog wrist watch with minimalist dial.",
    price: 1999,
    category: "Accessories",
    brand: "TimeCraft",
    stock: 15,
    isFeatured: true,
  },
  {
    name: "Polarized Sunglasses",
    description: "Modern polarized sunglasses for everyday outdoor use.",
    price: 999,
    category: "Accessories",
    brand: "SunStyle",
    stock: 35,
    isFeatured: false,
  },
  {
    name: "Leather Wallet",
    description:
      "Compact wallet with multiple card slots and cash compartment.",
    price: 799,
    category: "Accessories",
    brand: "UrbanWear",
    stock: 45,
    isFeatured: false,
  },
  {
    name: "Minimalist Backpack",
    description: "Lightweight everyday backpack with multiple compartments.",
    price: 1399,
    category: "Accessories",
    brand: "StyleCraft",
    stock: 25,
    isFeatured: true,
  },
  {
    name: "Classic Leather Belt",
    description: "Adjustable everyday belt with a durable metal buckle.",
    price: 699,
    category: "Accessories",
    brand: "UrbanWear",
    stock: 38,
    isFeatured: false,
  },
  {
    name: "Fashion Wrist Bracelet",
    description: "Minimalist bracelet suitable for casual outfits.",
    price: 499,
    category: "Accessories",
    brand: "StyleCraft",
    stock: 42,
    isFeatured: false,
  },
  {
    name: "Travel Organizer Pouch",
    description:
      "Compact organizer pouch for travel accessories and essentials.",
    price: 599,
    category: "Accessories",
    brand: "TravelMate",
    stock: 30,
    isFeatured: false,
  },
  {
    name: "Premium Analog Sunglasses",
    description: "Stylish sunglasses with a lightweight frame.",
    price: 1299,
    category: "Accessories",
    brand: "SunStyle",
    stock: 20,
    isFeatured: true,
  },

  // SPORTS
  {
    name: "Yoga Exercise Mat",
    description:
      "Non-slip exercise mat for yoga, stretching and home workouts.",
    price: 899,
    category: "Sports",
    brand: "ActiveStep",
    stock: 32,
    isFeatured: false,
  },
  {
    name: "Adjustable Dumbbell Set",
    description: "Adjustable dumbbell set for strength training at home.",
    price: 3499,
    category: "Sports",
    brand: "FitLife",
    stock: 10,
    isFeatured: true,
  },
  {
    name: "Sports Gym Duffel Bag",
    description: "Spacious gym duffel bag with separate storage compartments.",
    price: 1299,
    category: "Sports",
    brand: "FitLife",
    stock: 24,
    isFeatured: false,
  },
  {
    name: "Football Training Ball",
    description: "Durable football suitable for recreational and training use.",
    price: 999,
    category: "Sports",
    brand: "PlayPro",
    stock: 26,
    isFeatured: true,
  },
  {
    name: "Fitness Resistance Bands",
    description: "Resistance bands for strength training and stretching.",
    price: 499,
    category: "Sports",
    brand: "FitLife",
    stock: 50,
    isFeatured: false,
  },
  {
    name: "Professional Cricket Bat",
    description: "Wooden cricket bat suitable for recreational cricket.",
    price: 2499,
    category: "Sports",
    brand: "PlayPro",
    stock: 12,
    isFeatured: false,
  },
  {
    name: "Sports Water Bottle",
    description:
      "Lightweight reusable bottle for workouts and outdoor activities.",
    price: 399,
    category: "Sports",
    brand: "ActiveStep",
    stock: 40,
    isFeatured: false,
  },
  {
    name: "Skipping Rope",
    description: "Adjustable skipping rope for cardio and fitness training.",
    price: 299,
    category: "Sports",
    brand: "FitLife",
    stock: 55,
    isFeatured: false,
  },
  {
    name: "Badminton Racket Set",
    description: "Badminton racket set suitable for casual recreational play.",
    price: 1499,
    category: "Sports",
    brand: "PlayPro",
    stock: 18,
    isFeatured: true,
  },
  {
    name: "Fitness Training Gloves",
    description:
      "Comfortable workout gloves with grip support for gym training.",
    price: 599,
    category: "Sports",
    brand: "FitLife",
    stock: 30,
    isFeatured: false,
  },
];

// Representative product image sources.
// Cloudinary will fetch and store these images in your account.
const imageSources: Record<string, string[]> = {
  Electronics: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1526738549149-8e07eca6c147",
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
  ],
  Fashion: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
  ],
  "Home & Kitchen": [
    "https://images.unsplash.com/photo-1556911220-bff31c812dba",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85",
  ],
  Accessories: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
    "https://images.unsplash.com/photo-1627123424574-724758594e93",
  ],
  Sports: [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
  ],
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function getCloudinaryImage(
  product: SeedProduct,
  imageIndex: number,
): Promise<string> {
  const sources = imageSources[product.category];

  if (!sources?.length) {
    throw new Error(`No image sources configured for ${product.category}`);
  }

  const source = sources[imageIndex % sources.length];

  const publicId = `seed-${slugify(product.brand)}-${slugify(product.name)}`;

  const uploaded = await cloudinary.uploader.upload(
    `${source}?auto=format&fit=crop&w=900&q=80`,
    {
      folder: "mern-ecommerce/products",
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
    },
  );

  return uploaded.secure_url;
}

async function seedProducts(): Promise<void> {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MongoDB URI missing. Check MONGO_URI or MONGODB_URI in backend/.env",
    );
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  let inserted = 0;
  let updated = 0;
  let skippedUploads = 0;
  let failed = 0;

  console.log(`Starting to seed ${products.length} products...`);

  for (let index = 0; index < products.length; index++) {
    const product = products[index];

    try {
      const filter = {
        name: product.name,
        brand: product.brand,
      };

      const existingProduct = await Product.findOne(filter).select("images");

      let imageUrl = existingProduct?.images?.find((url: string) =>
        url.includes("res.cloudinary.com"),
      );

      if (imageUrl) {
        skippedUploads++;
        console.log(
          `[${index + 1}/${products.length}] Reusing image: ${product.name}`,
        );
      } else {
        console.log(
          `[${index + 1}/${products.length}] Uploading image: ${product.name}`,
        );
        imageUrl = await getCloudinaryImage(product, index);
      }

      const result = await Product.updateOne(
        filter,
        {
          $set: {
            ...product,
            images: [imageUrl],
          },
        },
        {
          upsert: true,
          runValidators: true,
        },
      );

      if (result.upsertedCount > 0) {
        inserted++;
      } else if (result.modifiedCount > 0) {
        updated++;
      }

      console.log(`Saved: ${product.name}`);
    } catch (error) {
      failed++;
      console.error(`Failed: ${product.name}`, error);
    }
  }

  console.log("\n========== SEED SUMMARY ==========");
  console.log(`Products in seed list: ${products.length}`);
  console.log(`New products inserted: ${inserted}`);
  console.log(`Existing products updated: ${updated}`);
  console.log(`Existing Cloudinary images reused: ${skippedUploads}`);
  console.log(`Failed products: ${failed}`);
  console.log("==================================\n");

  if (failed > 0) {
    throw new Error(`${failed} product(s) could not be seeded.`);
  }
}

seedProducts()
  .catch((error) => {
    console.error("Product seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
