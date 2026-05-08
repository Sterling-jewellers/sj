import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Category from '../models/Category.model';
import Product from '../models/Product.model';
import Diamond from '../models/Diamond.model';
import User from '../models/User.model';

dotenv.config();

// ── Consistent shape-specific diamond photos ──────────────────────────────────
// Each shape maps to a SINGLE consistent photo so the inventory looks
// professional — every round diamond shows the same round-diamond photo, etc.
// No stock photo URLs — imageUrl is left null so the client renders
// SVG diamond illustrations as fallback. When Nivoda credentials work,
// real Nivoda images are used automatically instead.
const SHAPE_PHOTOS: Record<string, null> = {
  round: null, oval: null, princess: null, cushion: null, emerald: null,
  pear: null, radiant: null, asscher: null, marquise: null, heart: null,
};

// ── Diamond pricing engine ────────────────────────────────────────────────────
// Mimics real Rapaport-style pricing multipliers
function calcPrice(carat: number, color: string, clarity: string, cut: string): number {
  const base = carat * carat * 2200; // carat-squared pricing (standard in trade)

  // Color multipliers (D = best)
  const colorMult: Record<string, number> = {
    D: 1.45, E: 1.38, F: 1.30, G: 1.20, H: 1.10, I: 1.02, J: 0.95, K: 0.85,
  };
  // Clarity multipliers
  const clarityMult: Record<string, number> = {
    FL: 1.50, IF: 1.42, VVS1: 1.32, VVS2: 1.24, VS1: 1.15, VS2: 1.08,
    SI1: 0.96, SI2: 0.88, I1: 0.72,
  };
  // Cut multipliers
  const cutMult: Record<string, number> = {
    Ideal: 1.18, Excellent: 1.12, 'Very Good': 1.05, Good: 0.95, Fair: 0.82,
  };

  const price = base
    * (colorMult[color] ?? 1)
    * (clarityMult[clarity] ?? 1)
    * (cutMult[cut] ?? 1);

  // Round to nearest £50
  return Math.max(250, Math.round(price / 50) * 50);
}

// ── Measurement calculator (realistic for each carat) ────────────────────────
function measurements(shape: string, carat: number) {
  // Approximate length/width for each shape based on carat
  const d = Math.cbrt(carat) * 6.5; // diameter equivalent
  const ratios: Record<string, [number, number, number]> = {
    round:    [1,    1,    0.615],
    oval:     [1.35, 1,    0.60],
    princess: [1,    1,    0.68],
    cushion:  [1.05, 1,    0.65],
    emerald:  [1.45, 1,    0.63],
    pear:     [1.55, 1,    0.62],
    radiant:  [1.10, 1,    0.67],
    asscher:  [1,    1,    0.67],
    marquise: [2.00, 1,    0.57],
    heart:    [1,    1,    0.60],
  };
  const [lr, wr, dr] = ratios[shape] ?? [1, 1, 0.615];
  const w = d / Math.sqrt(lr);
  const l = w * lr;
  return {
    length:       Math.round(l * 100) / 100,
    width:        Math.round(w * 100) / 100,
    depth:        Math.round(w * dr * 100) / 100,
    depthPercent: Math.round((dr * 100) * 10) / 10,
    tablePercent: shape === 'emerald' || shape === 'asscher' ? 63 : 57,
  };
}

// ── Seeder ────────────────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('🔗 Connected to MongoDB');

  await Promise.all([
    Category.deleteMany(),
    Product.deleteMany(),
    Diamond.deleteMany(),
    User.deleteOne({ email: 'admin@sterlingjewellers.co.uk' }),
  ]);
  console.log('🧹 Cleared existing data');

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = await Category.insertMany([
    { name: 'Engagement Rings', slug: 'engagement-rings', description: 'Find your perfect engagement ring', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=400&fit=crop', sortOrder: 1 },
    { name: 'Wedding Rings',    slug: 'wedding-rings',    description: 'Beautiful wedding bands for your special day', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop', sortOrder: 2 },
    { name: 'Eternity Rings',   slug: 'eternity-rings',   description: 'Celebrate your love with an eternity ring', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=400&fit=crop', sortOrder: 3 },
    { name: 'Necklaces',        slug: 'necklaces',        description: 'Elegant diamond and gold necklaces', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=400&fit=crop', sortOrder: 4 },
    { name: 'Wedding Bands',    slug: 'wedding-bands',    description: 'Beautiful matching wedding bands', image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=400&fit=crop', sortOrder: 5 },
  ]);
  const [engCat, weddCat, eternCat, neckCat] = categories;

  // ── Products ─────────────────────────────────────────────────────────────────
  await Product.insertMany([
    { name: 'Classic Round Brilliant Solitaire', slug: 'classic-round-brilliant-solitaire', description: '<p>The epitome of elegance, our Classic Round Brilliant Solitaire engagement ring features a four-claw setting that allows maximum light to enter the diamond.</p>', shortDescription: 'A timeless four-claw solitaire setting.', category: engCat._id, subCategory: 'solitaire', basePrice: 1250, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 200, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'rose-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['G','H','I','J','K','L','M','N','O','P','Q','R'].map(s => ({ size: s, stock: 5, sku: `SJ-CRBS-${s}` })), style: 'solitaire', gemstone: 'round', settingType: 'four-claw', isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: false, deliveryDays: 7, averageRating: 4.9, reviewCount: 124, isActive: true },
    { name: 'Oval Halo Diamond Ring', slug: 'oval-halo-diamond-ring', description: '<p>Our stunning Oval Halo ring features a dazzling oval centre diamond surrounded by a pavé halo of brilliant round diamonds.</p>', shortDescription: 'An oval centre diamond with a brilliant pavé diamond halo.', category: engCat._id, subCategory: 'halo', basePrice: 1875, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 250, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'rose-gold', karat: '18ct', priceModifier: 50, images: [], isDefault: false }], variants: ['G','H','I','J','K','L','M','N','O','P'].map(s => ({ size: s, stock: 3, sku: `SJ-OHR-${s}` })), style: 'halo', gemstone: 'oval', settingType: 'halo', isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: true, deliveryDays: 7, averageRating: 4.8, reviewCount: 89, isActive: true },
    { name: 'Princess Cut Solitaire', slug: 'princess-cut-solitaire', description: '<p>Clean lines and contemporary style define our Princess Cut Solitaire ring.</p>', shortDescription: 'A modern four-claw setting for the princess cut diamond.', category: engCat._id, basePrice: 995, images: ['https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=600&h=600&fit=crop'], metalOptions: [{ type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: true }, { type: 'platinum', priceModifier: 150, images: [], isDefault: false }], variants: ['H','I','J','K','L','M','N'].map(s => ({ size: s, stock: 4, sku: `SJ-PCS-${s}` })), style: 'solitaire', gemstone: 'princess', isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: true, deliveryDays: 7, averageRating: 4.7, reviewCount: 56, isActive: true },
    { name: 'Vintage Floral Diamond Ring', slug: 'vintage-floral-diamond-ring', description: '<p>Inspired by Victorian-era jewellery with intricate milgrain detailing.</p>', shortDescription: 'Intricate vintage floral design with milgrain diamond cluster.', category: engCat._id, basePrice: 2250, salePrice: 1890, images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop'], metalOptions: [{ type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: true }, { type: 'rose-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['G','H','I','J','K','L','M'].map(s => ({ size: s, stock: 2, sku: `SJ-VFR-${s}` })), style: 'vintage', gemstone: 'round', isEngravable: true, isFeatured: true, isBestseller: false, isNewArrival: false, deliveryDays: 10, isActive: true },
    { name: 'Full Diamond Eternity Ring', slug: 'full-diamond-eternity-ring', description: '<p>A continuous band of brilliant round diamonds symbolising unending love.</p>', shortDescription: 'Full band of hand-matched round brilliant diamonds.', category: eternCat._id, basePrice: 3200, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 300, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['I','J','K','L','M','N','O'].map(s => ({ size: s, stock: 3, sku: `SJ-FDER-${s}` })), style: 'eternity', gemstone: 'round', isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: false, deliveryDays: 14, isActive: true },
    { name: 'Diamond Solitaire Necklace', slug: 'diamond-solitaire-necklace', description: '<p>A delicate necklace featuring a single brilliant-cut diamond on a fine platinum chain.</p>', shortDescription: 'A brilliant-cut diamond on a fine 45cm chain.', category: neckCat._id, basePrice: 875, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop'], metalOptions: [{ type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: true }, { type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'platinum', priceModifier: 100, images: [], isDefault: false }], variants: [], style: 'solitaire', gemstone: 'round', isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: true, deliveryDays: 5, isActive: true },
    { name: 'Court Shaped Wedding Band', slug: 'court-shaped-wedding-band', description: '<p>Our most popular wedding band style with a comfortable rounded inner edge.</p>', shortDescription: 'Classic court-shaped comfort-fit wedding band.', category: weddCat._id, basePrice: 425, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 200, images: [], isDefault: true }, { type: 'yellow-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['N','O','P','Q','R','S','T','U','V','W'].map(s => ({ size: s, stock: 8, sku: `SJ-CSWB-${s}` })), style: 'court', isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: false, deliveryDays: 7, isActive: true },
    { name: 'Cushion Cut Three Stone Ring', slug: 'cushion-cut-three-stone-ring', description: '<p>Representing past, present and future with a cushion cut centre diamond flanked by two round side stones.</p>', shortDescription: 'Past, present, future symbolism with cushion cut centre stone.', category: engCat._id, basePrice: 3450, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop'], metalOptions: [{ type: 'platinum', priceModifier: 350, images: [], isDefault: true }, { type: 'white-gold', karat: '18ct', priceModifier: 0, images: [], isDefault: false }], variants: ['H','I','J','K','L','M','N'].map(s => ({ size: s, stock: 2, sku: `SJ-CTSR-${s}` })), style: 'three-stone', gemstone: 'cushion', isEngravable: true, isFeatured: true, isBestseller: false, isNewArrival: true, deliveryDays: 10, isActive: true },
  ]);
  console.log('✓ 8 products seeded');

  // ── Diamonds ─────────────────────────────────────────────────────────────────
  // 160 diamonds across 10 shapes with realistic distribution (more round/oval)
  type DiamondShape = keyof typeof SHAPE_PHOTOS;

  const shapes: DiamondShape[] = [
    // Round is most popular — 40 diamonds
    ...Array(40).fill('round'),
    // Oval — 25 diamonds
    ...Array(25).fill('oval'),
    // Cushion — 18
    ...Array(18).fill('cushion'),
    // Princess — 18
    ...Array(18).fill('princess'),
    // Emerald — 15
    ...Array(15).fill('emerald'),
    // Pear — 12
    ...Array(12).fill('pear'),
    // Radiant — 10
    ...Array(10).fill('radiant'),
    // Asscher — 8
    ...Array(8).fill('asscher'),
    // Marquise — 8
    ...Array(8).fill('marquise'),
    // Heart — 6
    ...Array(6).fill('heart'),
  ] as DiamondShape[];

  const cuts     = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'] as const;
  const colors   = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] as const;
  const clarities = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'] as const;
  const labs     = ['GIA', 'IGI', 'GIA', 'GIA'] as const; // GIA more common

  // ── Carat distribution: realistic bell curve around 1ct ──
  // Spread across: 0.25, 0.30, 0.40, 0.50, 0.60, 0.70, 0.75, 0.80, 0.90,
  //                1.00, 1.01, 1.10, 1.20, 1.25, 1.50, 1.51, 1.75, 2.00,
  //                2.01, 2.50, 3.00, 4.00, 5.00
  const caratPool = [
    0.25, 0.30, 0.30, 0.40, 0.40, 0.50, 0.50, 0.50,
    0.60, 0.60, 0.70, 0.70, 0.75, 0.75, 0.80, 0.80,
    0.90, 0.90, 0.90, 0.91, 0.95, 0.95,
    1.00, 1.00, 1.00, 1.00, 1.01, 1.01, 1.02, 1.05,
    1.10, 1.10, 1.15, 1.20, 1.20, 1.25, 1.25,
    1.30, 1.40, 1.48, 1.50, 1.50, 1.51, 1.52, 1.55,
    1.60, 1.70, 1.75, 1.80,
    1.90, 1.95, 2.00, 2.00, 2.01, 2.02, 2.10, 2.25,
    2.50, 2.51, 2.75,
    3.00, 3.01, 3.25, 3.50,
    4.00, 4.01, 4.50,
    5.00,
  ];

  const fluorescences = ['None', 'None', 'None', 'Faint', 'Medium', 'Strong'];
  const polishes      = ['Excellent', 'Excellent', 'Very Good', 'Good'];
  const symmetries    = ['Excellent', 'Excellent', 'Very Good', 'Good'];

  // Deterministic but varied picks using index-based selection
  const pick = <T>(arr: readonly T[], i: number, spread = 1): T =>
    arr[Math.floor((i * spread * 7 + i * 3) % arr.length)];

  const diamondData = shapes.map((shape, i) => {
    const carat     = caratPool[i % caratPool.length];
    const color     = pick(colors,     i, 2);
    const clarity   = pick(clarities,  i, 3);
    const cut       = pick(cuts,       i, 5);
    const lab       = pick(labs,       i, 1);
    const fluor     = pick(fluorescences, i, 4);
    const polish    = pick(polishes,   i, 6);
    const symmetry  = pick(symmetries, i, 7);
    const certNum   = String(1000000 + ((i * 937) % 8999999)).padStart(7, '0');

    return {
      sku:         `DIA-${String(i + 1).padStart(4, '0')}`,
      shape,
      caratWeight: carat,
      cut,
      color,
      clarity,
      price:       calcPrice(carat, color, clarity, cut),
      certificate: { lab, number: certNum },
      measurements: measurements(shape, carat),
      fluorescence: fluor,
      polish,
      symmetry,
      imageUrl:     SHAPE_PHOTOS[shape] ?? undefined,
      isAvailable:  true,
    };
  });

  await Diamond.insertMany(diamondData);
  console.log(`✓ ${diamondData.length} diamonds seeded across 10 shapes`);

  // ── Admin user ───────────────────────────────────────────────────────────────
  const adminUser = new User({
    firstName: 'Admin',
    lastName:  'User',
    email:     'admin@sterlingjewellers.co.uk',
    password:  'Admin@123',
    role:      'admin',
    provider:  'local',
  });
  await adminUser.save();
  console.log('✓ Admin user created (admin@sterlingjewellers.co.uk / Admin@123)');

  console.log('\n🎉 Seed complete!');
  console.log(`   - ${categories.length} categories`);
  console.log(`   - 8 products`);
  console.log(`   - ${diamondData.length} diamonds (10 shapes)`);
  console.log('   - 1 admin user');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
