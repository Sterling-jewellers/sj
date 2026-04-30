import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Category from '../models/Category.model';
import Product from '../models/Product.model';
import Diamond from '../models/Diamond.model';
import User from '../models/User.model';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');

  await Promise.all([Category.deleteMany(), Product.deleteMany(), Diamond.deleteMany()]);

  const categories = await Category.insertMany([
    { name: 'Engagement Rings', slug: 'engagement-rings', description: 'Find your perfect engagement ring', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=400&fit=crop', sortOrder: 1 },
    { name: 'Wedding Rings', slug: 'wedding-rings', description: 'Beautiful wedding bands for your special day', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop', sortOrder: 2 },
    { name: 'Eternity Rings', slug: 'eternity-rings', description: 'Celebrate your love with an eternity ring', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=400&fit=crop', sortOrder: 3 },
    { name: 'Necklaces', slug: 'necklaces', description: 'Elegant diamond and gold necklaces', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=400&fit=crop', sortOrder: 4 },
    { name: 'Wedding Bands', slug: 'wedding-bands', description: 'Beautiful matching wedding bands', image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=400&fit=crop', sortOrder: 5 },
  ]);

  const [engCat, weddCat, eternCat, neckCat] = categories;

  await Product.insertMany([
    { name: 'Classic Round Brilliant Solitaire', slug: 'classic-round-brilliant-solitaire', description: '<p>The epitome of elegance, our Classic Round Brilliant Solitaire engagement ring features a four-claw setting that allows maximum light to enter the diamond.</p>', shortDescription: 'A timeless four-claw solitaire setting.', category: engCat._id, subCategory: 'solitaire', basePrice: 1250, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 200, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'rose-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['G','H','I','J','K','L','M','N','O','P','Q','R'].map(s => ({ size: s, stock: 5, sku: `SJ-CRBS-${s}` })), style: 'solitaire', gemstone: 'round', settingType: 'four-claw', isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: false, deliveryDays: 7, averageRating: 4.9, reviewCount: 124 },
    { name: 'Oval Halo Diamond Ring', slug: 'oval-halo-diamond-ring', description: '<p>Our stunning Oval Halo ring features a dazzling oval centre diamond surrounded by a pavé halo of brilliant round diamonds.</p>', shortDescription: 'An oval centre diamond with a brilliant pavé diamond halo.', category: engCat._id, subCategory: 'halo', basePrice: 1875, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 250, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'rose-gold', karat: '18ct', priceModifier: 50, images: [], isDefault: false }], variants: ['G','H','I','J','K','L','M','N','O','P'].map(s => ({ size: s, stock: 3, sku: `SJ-OHR-${s}` })), style: 'halo', gemstone: 'oval', settingType: 'halo', isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: true, deliveryDays: 7, averageRating: 4.8, reviewCount: 89 },
    { name: 'Princess Cut Solitaire', slug: 'princess-cut-solitaire', description: '<p>Clean lines and contemporary style define our Princess Cut Solitaire ring.</p>', shortDescription: 'A modern four-claw setting for the princess cut diamond.', category: engCat._id, basePrice: 995, images: ['https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=600&h=600&fit=crop'], metalOptions: [{ type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: true }, { type: 'platinum', priceModifier: 150, images: [], isDefault: false }], variants: ['H','I','J','K','L','M','N'].map(s => ({ size: s, stock: 4, sku: `SJ-PCS-${s}` })), style: 'solitaire', gemstone: 'princess', isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: true, deliveryDays: 7, averageRating: 4.7, reviewCount: 56 },
    { name: 'Vintage Floral Diamond Ring', slug: 'vintage-floral-diamond-ring', description: '<p>Inspired by Victorian-era jewellery with intricate milgrain detailing.</p>', shortDescription: 'Intricate vintage floral design with milgrain diamond cluster.', category: engCat._id, basePrice: 2250, salePrice: 1890, images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop'], metalOptions: [{ type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: true }, { type: 'rose-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['G','H','I','J','K','L','M'].map(s => ({ size: s, stock: 2, sku: `SJ-VFR-${s}` })), style: 'vintage', gemstone: 'round', isEngravable: true, isFeatured: true, isBestseller: false, isNewArrival: false, deliveryDays: 10 },
    { name: 'Full Diamond Eternity Ring', slug: 'full-diamond-eternity-ring', description: '<p>A continuous band of brilliant round diamonds symbolising unending love.</p>', shortDescription: 'Full band of hand-matched round brilliant diamonds.', category: eternCat._id, basePrice: 3200, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 300, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['I','J','K','L','M','N','O'].map(s => ({ size: s, stock: 3, sku: `SJ-FDER-${s}` })), style: 'eternity', gemstone: 'round', isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: false, deliveryDays: 14 },
    { name: 'Diamond Solitaire Necklace', slug: 'diamond-solitaire-necklace', description: '<p>A delicate necklace featuring a single brilliant-cut diamond on a fine platinum chain.</p>', shortDescription: 'A brilliant-cut diamond on a fine 45cm chain.', category: neckCat._id, basePrice: 875, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop'], metalOptions: [{ type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: true }, { type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'platinum', priceModifier: 100, images: [], isDefault: false }], variants: [], style: 'solitaire', gemstone: 'round', isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: true, deliveryDays: 5 },
    { name: 'Court Shaped Wedding Band', slug: 'court-shaped-wedding-band', description: '<p>Our most popular wedding band style with a comfortable rounded inner edge.</p>', shortDescription: 'Classic court-shaped comfort-fit wedding band.', category: weddCat._id, basePrice: 425, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 200, images: [], isDefault: true }, { type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['N','O','P','Q','R','S','T','U','V','W'].map(s => ({ size: s, stock: 8, sku: `SJ-CSWB-${s}` })), style: 'court', isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: false, deliveryDays: 7 },
    { name: 'Cushion Cut Three Stone Ring', slug: 'cushion-cut-three-stone-ring', description: '<p>Representing past, present and future with a cushion cut centre diamond flanked by two round side stones.</p>', shortDescription: 'Past, present, future symbolism with cushion cut centre stone.', category: engCat._id, basePrice: 3450, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 350, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['H','I','J','K','L','M','N'].map(s => ({ size: s, stock: 2, sku: `SJ-CTSR-${s}` })), style: 'three-stone', gemstone: 'cushion', isEngravable: true, isFeatured: true, isBestseller: false, isNewArrival: true, deliveryDays: 10 },
  ]);

  const shapes = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear'];
  const cuts: Array<'Ideal' | 'Excellent' | 'Very Good' | 'Good'> = ['Ideal', 'Excellent', 'Very Good', 'Good'];
  const colors: Array<'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'> = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const clarities: Array<'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2'> = ['VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];
  const labs: Array<'GIA' | 'IGI'> = ['GIA', 'IGI'];

  const diamondData = Array.from({ length: 60 }, (_, i) => {
    const carat = Math.round((0.3 + Math.random() * 3.5) * 100) / 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const clarity = clarities[Math.floor(Math.random() * clarities.length)];
    const cut = cuts[Math.floor(Math.random() * cuts.length)];
    const base = carat * 1800 * (color <= 'F' ? 1.3 : 1) * (clarity <= 'VS1' ? 1.2 : 1) * (cut === 'Ideal' ? 1.15 : 1);
    return {
      sku: `DIA-${String(i + 1).padStart(4, '0')}`,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      caratWeight: carat, cut, color, clarity,
      price: Math.round(base / 50) * 50,
      certificate: { lab: labs[Math.floor(Math.random() * 2)], number: `${Math.floor(Math.random() * 9e6) + 1e6}` },
      measurements: { length: carat * 5.2, width: carat * 5.2, depth: carat * 3.1, depthPercent: 61.5, tablePercent: 57 },
      fluorescence: 'None', polish: 'Excellent', symmetry: 'Excellent',
    };
  });
  await Diamond.insertMany(diamondData);

  // Use save() so the pre-save bcrypt hook runs
  await User.deleteOne({ email: 'admin@sterlingjewellers.co.uk' });
  const adminUser = new User({
    firstName: 'Admin', lastName: 'User',
    email: 'admin@sterlingjewellers.co.uk',
    password: 'Admin@123',
    role: 'admin', provider: 'local',
  });
  await adminUser.save();

  console.log('✓ Seed complete: 8 products, 60 diamonds, 5 categories, 1 admin user');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
