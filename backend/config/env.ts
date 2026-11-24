const requiredEnvVariables = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
] as const;

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]?.trim()) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

if (process.env.JWT_SECRET!.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

const clientUrls = process.env
  .CLIENT_URL!.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

if (clientUrls.length === 0) {
  throw new Error("CLIENT_URL must contain at least one frontend URL");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  clientUrls,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
  },
};
