import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  processedAt: Date;
}

const paymentWebhookEventSchema = new Schema<IPaymentWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const PaymentWebhookEvent = mongoose.model<IPaymentWebhookEvent>(
  "PaymentWebhookEvent",
  paymentWebhookEventSchema,
);

export default PaymentWebhookEvent;
