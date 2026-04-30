import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, min: 0 },
    maxUses: Number,
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<ICoupon>('Coupon', couponSchema);
