import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type PaymentMethod = "cod" | "razorpay";

interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
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

export default function Checkout() {
  const navigate = useNavigate();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Keep this key for retries of the same checkout attempt.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateAddress = (): boolean => {
    const requiredFields: (keyof ShippingAddress)[] = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
    ];

    for (const field of requiredFields) {
      if (!address[field].trim()) {
        setError(
          `Please enter ${field.replace(/([A-Z])/g, " $1").toLowerCase()}.`,
        );
        return false;
      }
    }

    if (!/^[0-9]{10}$/.test(address.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return false;
    }

    return true;
  };

  const startRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error("Unable to load Razorpay checkout. Please try again.");
    }

    const response = await api.post<RazorpayOrderResponse>(
      "/payments/razorpay/create",
      { shippingAddress: address },
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    const paymentOrder = response.data;

    const options: RazorpayOptions = {
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: "MERN Ecommerce",
      description: "Order payment",
      order_id: paymentOrder.razorpayOrderId,

      handler: async (paymentResponse) => {
        try {
          const verification = await api.post(
            "/payments/razorpay/verify",
            paymentResponse,
          );

          const verifiedOrderId =
            verification.data.order?._id ??
            verification.data.orderId ??
            paymentOrder.orderId;

          navigate(`/orders/${verifiedOrderId}`);
        } catch (err: any) {
          setError(
            err.response?.data?.message ||
              "Payment verification failed. Contact support before attempting another payment.",
          );
        }
      },

      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
    };

    if (!window.Razorpay) {
      throw new Error("Razorpay checkout is not available.");
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!validateAddress()) return;

    setLoading(true);

    try {
      if (paymentMethod === "cod") {
        const response = await api.post("/orders/checkout", {
          shippingAddress: address,
        });

        const orderId =
          response.data.order?._id ??
          response.data.orderId ??
          response.data._id;

        if (!orderId) {
          throw new Error("Order was created but its ID was not returned.");
        }

        navigate(`/orders/${orderId}`);
        return;
      }

      await startRazorpayPayment();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Checkout failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const fields: {
    name: keyof ShippingAddress;
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    { name: "fullName", label: "Full name", placeholder: "Your full name" },
    {
      name: "phone",
      label: "Phone number",
      placeholder: "10-digit phone number",
    },
    {
      name: "addressLine1",
      label: "Address",
      placeholder: "House number, street",
    },
    {
      name: "addressLine2",
      label: "Address line 2",
      placeholder: "Landmark (optional)",
    },
    { name: "city", label: "City", placeholder: "City" },
    { name: "state", label: "State", placeholder: "State" },
    { name: "postalCode", label: "PIN code", placeholder: "PIN code" },
    { name: "country", label: "Country", placeholder: "Country" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-2xl font-bold">Checkout</h1>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-6">
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold">Shipping Address</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={
                    field.name === "addressLine1" ||
                    field.name === "addressLine2"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <label className="mb-1 block text-sm font-medium">
                    {field.label}
                    {field.name !== "addressLine2" && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>

                  <input
                    name={field.name}
                    type={field.type || "text"}
                    value={address[field.name]}
                    onChange={handleAddressChange}
                    placeholder={field.placeholder}
                    required={field.name !== "addressLine2"}
                    className="w-full rounded-lg border px-3 py-3 outline-none focus:border-black"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold">Payment Method</h2>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">
                    Pay when your order arrives.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />
                <div>
                  <p className="font-medium">Online Payment</p>
                  <p className="text-sm text-gray-500">
                    Pay securely using Razorpay.
                  </p>
                </div>
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-5 py-4 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : paymentMethod === "cod"
                ? "Place Order"
                : "Pay with Razorpay"}
          </button>
        </form>
      </div>
    </div>
  );
}
