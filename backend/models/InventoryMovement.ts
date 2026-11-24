import mongoose, { Document, Schema, Types } from "mongoose";

export type InventoryMovementType =
  "initial" | "adjustment" | "sale" | "cancellation" | "return";

export interface IInventoryMovement extends Document {
  product: Types.ObjectId;
  changedBy: Types.ObjectId;
  type: InventoryMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["initial", "adjustment", "sale", "cancellation", "return"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "Quantity change must be a whole number",
      },
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model<IInventoryMovement>(
  "InventoryMovement",
  inventoryMovementSchema,
);
