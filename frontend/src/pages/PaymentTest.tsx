import { useState } from "react";
import api from "../services/api";

interface CreatePaymentResponse {
  message: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const PaymentTest = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [paymentOrder, setPaymentOrder] =
    useState<CreatePaymentResponse | null>(null);

  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [address, setAddress] = useState({
    fullName: "Test Customer",
    phone: "9876543210",
    addressLine1: "House 25, Model Town",
    addressLine2: "",
    city: "Jalandhar",
    state: "Punjab",
    postalCode: "144003",
    country: "India",
  });

  const updateAddress = (field: keyof typeof address, value: string) => {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const startPayment = async () => {
    try {
      setLoading(true);
      setMessage("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Could not load Razorpay Checkout");
      }

      let currentPaymentOrder = paymentOrder;

      // Create the payment order only once.
      // Reuse it when the customer retries payment.
      if (!currentPaymentOrder) {
        const { data } = await api.post<CreatePaymentResponse>(
          "/payments/razorpay/create",
          { shippingAddress: address },
          {
            headers: {
              "Idempotency-Key": idempotencyKey,
            },
          },
        );

        currentPaymentOrder = data;
        setPaymentOrder(data);
      }

      const data = currentPaymentOrder;

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "MERN E-Commerce",
        description: "Order payment",
        order_id: data.razorpayOrderId,

        handler: async (response) => {
          try {
            setMessage("Verifying payment...");

            await api.post("/payments/razorpay/verify", response);

            setMessage(`Payment successful! Your order ID is ${data.orderId}`);

            setPaymentOrder(null);
          } catch (error: any) {
            setMessage(
              error.response?.data?.message ??
                "Payment verification failed. Please contact support.",
            );
          }
        },

        prefill: {
          name: address.fullName,
          contact: address.phone,
        },

        theme: {
          color: "#2563eb",
        },

        modal: {
          ondismiss: () => {
            setMessage(
              "Payment window closed. You can retry using the same payment order.",
            );
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is not available.");
      }

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setMessage(
          response.error?.description ?? "Payment failed. You can retry.",
        );
      });

      checkout.open();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ??
          error.message ??
          "Could not start payment",
      );
    } finally {
      setLoading(false);
    }
  };

  const fields: Array<{
    key: keyof typeof address;
    label: string;
  }> = [
    { key: "fullName", label: "Full name" },
    { key: "phone", label: "Phone" },
    { key: "addressLine1", label: "Address line 1" },
    { key: "addressLine2", label: "Address line 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "Postal code" },
    { key: "country", label: "Country" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Razorpay Payment Test
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Add products to your cart before starting the test payment.
        </p>

        <div className="mt-6 space-y-4">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label
                htmlFor={key}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {label}
              </label>

              <input
                id={key}
                value={address[key]}
                onChange={(event) => updateAddress(key, event.target.value)}
                required={key !== "addressLine2"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={startPayment}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Starting payment..." : "Pay with Razorpay"}
        </button>

        {message && (
          <p className="mt-4 break-words rounded-lg bg-gray-100 p-3 text-sm text-gray-800">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentTest;
