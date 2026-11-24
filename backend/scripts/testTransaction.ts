import mongoose from "mongoose";
import "dotenv/config";

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MongoDB connection string is missing from .env");
}

async function testTransaction() {
  try {
    await mongoose.connect(uri!);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await mongoose.connection.collection("transaction_tests").insertOne(
          {
            message: "MongoDB transaction is working",
            createdAt: new Date(),
          },
          { session },
        );
      });

      console.log("SUCCESS: MongoDB transaction committed.");
    } finally {
      await session.endSession();
    }
  } finally {
    await mongoose.disconnect();
  }
}

testTransaction().catch((error) => {
  console.error("TRANSACTION TEST FAILED:", error);
  process.exitCode = 1;
});
