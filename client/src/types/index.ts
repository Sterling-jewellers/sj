export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  addresses: IAddress[];
  wishlist: string[];
}

export interface IAddress {
  _id?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  parent?: string;
  sortOrder: number;
  sourceStore?: string;
}

export interface IMetalOption {
  type: 'yellow-gold' | 'white-gold' | 'rose-gold' | 'platinum' | 'silver';
  karat?: '9ct' | '14ct' | '18ct';
  priceModifier: number;
  images: string[];
  isDefault: boolean;
}

export interface IWeightBySize {
  size: string;
  weightGrams: number;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ICategory;
  subCategory?: string;
  basePrice: number;
  salePrice?: number;
  competitorPrice?: number;
  images: string[];
  videos?: string[];
  metalOptions: IMetalOption[];
  variants: { size: string; stock: number; sku: string }[];
  tags: string[];
  style?: string;
  gemstone?: string;
  settingType?: string;
  bandStyle?: 'plain' | 'pave' | 'half-pave' | 'channel' | 'twisted';
  shankWidth?: 'slim' | 'standard' | 'large';
  weightBySize?: IWeightBySize[];
  isEngravable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  weight?: number;
  certification?: string;
  averageRating: number;
  reviewCount: number;
  deliveryDays: number;
  aiGenerated?: boolean;
  model3dUrl?: string;
  model3dPreview?: string;
}

export interface IDiamond {
  _id: string;
  sku: string;
  shape: string;
  caratWeight: number;
  cut: string;
  color: string;
  clarity: string;
  price: number;
  certificate: { lab: string; number: string; pdfUrl?: string };
  measurements: { length: number; width: number; depth: number; depthPercent: number; tablePercent: number };
  fluorescence: string;
  polish: string;
  symmetry: string;
  imageUrl?: string;
  videoUrl?: string;
  loupe360?: string;   // Nivoda Loupe360 interactive viewer URL
  source?:   'nivoda' | 'local';  // where the data came from
}

export interface ICartItem {
  product: IProduct;
  quantity: number;
  selectedMetal?: string;
  selectedSize?: string;
  engraving?: string;
  diamond?: IDiamond;
  totalPrice: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  items: {
    product: IProduct;
    name: string;
    image: string;
    price: number;
    quantity: number;
    selectedMetal?: string;
    selectedSize?: string;
  }[];
  shippingAddress: IAddress;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; avatar?: string };
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}
