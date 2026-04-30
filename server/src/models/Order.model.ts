import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedMetal?: string;
  selectedSize?: string;
  engraving?: string;
  diamond?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  guestEmail?: string;
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    phone: string;
  };
  shippingMethod: 'standard' | 'express' | 'next-day';
  shippingCost: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  paymentMethod: 'stripe' | 'paypal';
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedMetal: String,
  selectedSize: String,
  engraving: String,
  diamond: { type: Schema.Types.ObjectId, ref: 'Diamond' },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: String,
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      county: { type: String, required: true },
      postcode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingMethod: { type: String, enum: ['standard', 'express', 'next-day'], default: 'standard' },
    shippingCost: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: String,
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['stripe', 'paypal'], default: 'stripe' },
    paymentIntentId: String,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    trackingNumber: String,
    trackingUrl: String,
    notes: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `SJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
