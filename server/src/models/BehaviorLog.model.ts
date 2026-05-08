import mongoose, { Document, Schema } from 'mongoose';

export interface IBehaviorLog extends Document {
  sessionId:   string;
  visitCount:  number;
  events:      Array<{
    type:       string;
    productId?: string;
    productSlug?: string;
    diamondId?: string;
    category?:  string;
    style?:     string;
    metal?:     string;
    price?:     number;
    query?:     string;
    timestamp:  number;
  }>;
  preferredStyles: Record<string, number>;
  preferredMetals: Record<string, number>;
  priceRangeMin:   number;
  priceRangeMax:   number;
  topShapes?:      string[];
  topCategories?:  string[];
  ip?:             string;
  userAgent?:      string;
  createdAt:       Date;
  updatedAt:       Date;
}

const behaviorLogSchema = new Schema<IBehaviorLog>(
  {
    sessionId:   { type: String, required: true, index: true },
    visitCount:  { type: Number, default: 1 },
    events: [{
      type:        String,
      productId:   String,
      productSlug: String,
      diamondId:   String,
      category:    String,
      style:       String,
      metal:       String,
      price:       Number,
      query:       String,
      timestamp:   Number,
    }],
    preferredStyles: { type: Map, of: Number, default: {} },
    preferredMetals: { type: Map, of: Number, default: {} },
    priceRangeMin:   { type: Number, default: 0 },
    priceRangeMax:   { type: Number, default: 50000 },
    topShapes:       [String],
    topCategories:   [String],
    ip:              String,
    userAgent:       String,
  },
  { timestamps: true }
);

// TTL: auto-delete behavior logs older than 6 months
behaviorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export default mongoose.model<IBehaviorLog>('BehaviorLog', behaviorLogSchema);
