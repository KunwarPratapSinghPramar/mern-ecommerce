import { expirePendingPayments } from "./expirePendingPayments.js";

const CHECK_INTERVAL_MS = 60 * 1000;

let isRunning = false;

export const startPaymentExpiryScheduler = (): void => {
  console.log("Payment expiry scheduler started.");

  const runExpiryCheck = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      await expirePendingPayments();
    } catch (error) {
      console.error("Payment expiry scheduler error:", error);
    } finally {
      isRunning = false;
    }
  };

  // Run once when the server starts.
  void runExpiryCheck();

  // Then check every minute.
  setInterval(() => {
    void runExpiryCheck();
  }, CHECK_INTERVAL_MS);
};
