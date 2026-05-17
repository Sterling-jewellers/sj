import mongoose, { Document, Schema } from 'mongoose';

export interface IDiamond extends Document {
  sku: string;
  nivodaId?: string;
  shape: 'round' | 'princess' | 'oval' | 'cushion' | 'emerald' | 'pear' | 'marquise' | 'radiant' | 'asscher' | 'heart';
  caratWeight: number;
  cut: 'Ideal' | 'Excellent' | 'Very Good' | 'Good' | 'Fair';
  color: 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';
  clarity: 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2' | 'I1';
  price: number;
  certificate: {
    lab: 'GIA' | 'IGI' | 'HRD' | 'AGS';
    number: string;
    pdfUrl?: string;
  };
  measurements: {
    length: number;
    width: number;
    depth: number;
    depthPercent: number;
    tablePercent: number;
  };
  fluorescence: 'None' | 'Faint' | 'Medium' | 'Strong' | 'Very Strong';
  polish: 'Excellent' | 'Very Good' | 'Good';
  symmetry: 'Excellent' | 'Very Good' | 'Good';
  imageUrl?: string;
  videoUrl?: string;
  loupe360?: string;
  isLabGrown: boolean;
  isAvailable: boolean;
  source?: string;
  createdAt: Date;
}

const diamondSchema = new Schema<IDiamond>(
  {
    sku: { type: String, required: true, unique: true },
    shape: {
      type: String,
      enum: ['round', 'princess', 'oval', 'cushion', 'emerald', 'pear', 'marquise', 'radiant', 'asscher', 'heart'],
      required: true,
    },
    caratWeight: { type: Number, required: true },
    cut: { type: String, enum: ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'], required: true },
    color: { type: String, enum: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'], required: true },
    clarity: { type: String, enum: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'], required: true },
    price: { type: Number, required: true },
    certificate: {
      lab: { type: String, enum: ['GIA', 'IGI', 'HRD', 'AGS'], required: true },
      number: { type: String, required: true },
      pdfUrl: String,
    },
    measurements: {
      length: Number,
      width: Number,
      depth: Number,
      depthPercent: Number,
      tablePercent: Number,
    },
    fluorescence: { type: String, enum: ['None', 'Faint', 'Medium', 'Strong', 'Very Strong'], default: 'None' },
    polish: { type: String, enum: ['Excellent', 'Very Good', 'Good'] },
    symmetry: { type: String, enum: ['Excellent', 'Very Good', 'Good'] },
    imageUrl: String,
    videoUrl: String,
    loupe360: String,
    isLabGrown: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    source: { type: String, default: 'manual' },
    nivodaId: { type: String, index: true },
  },
  { timestamps: true }
);

diamondSchema.index({ shape: 1, caratWeight: 1, price: 1 });
diamondSchema.index({ color: 1, clarity: 1 });
diamondSchema.index({ isAvailable: 1, price: 1 });
diamondSchema.index({ isAvailable: 1, shape: 1, caratWeight: 1 });
diamondSchema.index({ 'certificate.lab': 1 });
diamondSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model<IDiamond>('Diamond', diamondSchema);
