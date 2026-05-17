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
  const [engCat, weddCat, eternCat] = categories;

  // ── Ring image helpers ────────────────────────────────────────────────────────
  // All images are real jewellery photographs from Wikimedia Commons
  // (Creative Commons / free commercial licence — visually verified)
  const WM = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

  // Verified Wikimedia Commons ring photos:
  const vintage_solitaire   = WM('4/42/Vintage_diamond_engagement_ring.jpg');
  const estate_pave         = WM('1/1e/12060-from_Estate_Diamond_Jewelry.jpg');
  const cushion_solitaire   = WM('c/c0/Champagne_Cushion_Cut_Lab_Grown_Diamond_Solitaire_Ring.jpg');
  const unique_halo         = WM('e/e2/Unique_Halo_Engagement_Rings.jpg');
  const rose_gold_halo      = WM('b/b5/Rose_Gold_Diamond_Engagement_Ring.jpg');
  const platinum_solitaire  = WM('f/f9/Diamond_engagement_ring_platinum_dr101_handstill4_1300.jpg');
  const oval_pave_solitaire = WM('5/5c/Chelsea-solitaire-engagement-ring-oval-3-rows-pave-18k-white-gold.jpg');
  const diamond_ring_macro  = WM('9/93/Diamond_ring_by_Jennifer_Dickert.jpg');
  const eternity_band       = WM('7/7e/Bezel_set_Ruby_and_Diamond_Eternity_Band.jpg');
  const three_stone_ring    = WM('1/1b/Three_Stones_Diamond_engagement_ring_yellow_gold_made_by_1791_Diamond.jpg');
  const traditional_band    = WM('5/56/Traditional_Wedding_Ring.jpg');
  const gold_band           = WM('d/df/Gold_wedding_ring.jpg');
  const gold_garnets        = WM('a/af/Gold_ring_with_diamonds_and_garnets_2.jpg');

  const RING_IMGS = {
    solitaire:   [vintage_solitaire,   diamond_ring_macro],   // classic diamond solitaire
    halo:        [unique_halo,         rose_gold_halo],       // halo engagement ring
    threeStone:  [three_stone_ring,    platinum_solitaire],   // three stone / multi diamond
    pave:        [estate_pave,         oval_pave_solitaire],  // pavé / side stones
    vintage:     [vintage_solitaire,   gold_garnets],         // vintage / floral style
    band:        [traditional_band,    gold_band],            // plain bands / wedding rings
    eternity:    [eternity_band,       traditional_band],     // eternity rings
    cluster:     [rose_gold_halo,      estate_pave],          // cluster / multi stone
    twoRow:      [gold_band,           gold_garnets],         // double row / modern
    channel:     [traditional_band,    diamond_ring_macro],   // channel set
    mens:        [gold_band,           traditional_band],     // men's / bold bands
    emeraldCut:  [platinum_solitaire,  diamond_ring_macro],   // emerald cut settings
    cushionHalo: [cushion_solitaire,   unique_halo],          // cushion halo
    oval:        [oval_pave_solitaire, vintage_solitaire],    // oval solitaire
    marquise:    [platinum_solitaire,  unique_halo],          // marquise setting
  };
  const sizes = (prefix: string) => ['G','H','I','J','K','L','M','N','O','P'].map(s => ({ size: s, stock: Math.ceil(Math.random()*6)+1, sku: `${prefix}-${s}` }));
  const plat = { type: 'platinum',    priceModifier: 200, images: [], isDefault: true };
  const wg18 = { type: 'white-gold',  karat: '18ct', priceModifier: 0,   images: [], isDefault: false };
  const yg18 = { type: 'yellow-gold', karat: '18ct', priceModifier: 0,   images: [], isDefault: false };
  const rg18 = { type: 'rose-gold',   karat: '18ct', priceModifier: 30,  images: [], isDefault: false };
  const plat9 = { type: 'platinum',   priceModifier: 150, images: [], isDefault: false };
  const wg9  = { type: 'white-gold',  karat: '9ct',  priceModifier: 0,   images: [], isDefault: true };

  // ── Products ─────────────────────────────────────────────────────────────────
  await Product.insertMany([
    // ── ENGAGEMENT RINGS ─────────────────────────────────────────────────────
    {
      name: 'Classic Round Brilliant Solitaire', slug: 'classic-round-brilliant-solitaire',
      description: '<p>The pinnacle of timeless elegance. Our Classic Round Brilliant Solitaire features a four-claw platinum setting that holds the diamond high, allowing maximum light performance from every angle.</p>',
      shortDescription: 'A timeless four-claw solitaire — the most popular engagement ring style worldwide.',
      category: engCat._id, subCategory: 'solitaire', basePrice: 1250,
      images: RING_IMGS.solitaire,
      metalOptions: [plat, wg18, yg18, rg18], variants: sizes('SJ-CRBS'),
      style: 'solitaire', gemstone: 'round', settingType: 'four-claw',
      isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.9, reviewCount: 247, isActive: true,
    },
    {
      name: 'Oval Halo Diamond Ring', slug: 'oval-halo-diamond-ring',
      description: '<p>An oval centre diamond surrounded by a brilliant pavé halo of micro-set round diamonds. The elongated shape creates an elegant, finger-lengthening effect.</p>',
      shortDescription: 'Oval centre with a sparkling pavé diamond halo.',
      category: engCat._id, subCategory: 'halo', basePrice: 1875,
      images: RING_IMGS.halo,
      metalOptions: [plat, wg18, rg18], variants: sizes('SJ-OHR'),
      style: 'halo', gemstone: 'oval', settingType: 'halo',
      isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.8, reviewCount: 189, isActive: true,
    },
    {
      name: 'Princess Cut Solitaire', slug: 'princess-cut-solitaire',
      description: '<p>Clean lines and contemporary geometry. The princess cut solitaire combines modern architecture with classic elegance in a four-claw 18ct white gold setting.</p>',
      shortDescription: 'Contemporary four-claw setting for the princess cut.',
      category: engCat._id, basePrice: 995,
      images: [cushion_solitaire, vintage_solitaire],
      metalOptions: [wg18, plat], variants: sizes('SJ-PCS'),
      style: 'solitaire', gemstone: 'princess', settingType: 'four-claw',
      isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: true,
      deliveryDays: 7, averageRating: 4.7, reviewCount: 103, isActive: true,
    },
    {
      name: 'Cushion Halo Pavé Ring', slug: 'cushion-halo-pave-ring',
      description: '<p>A cushion-cut diamond nestled in a double halo of brilliant pavé diamonds. The soft pillow shape paired with the sparkling halo creates a romantic, vintage-inspired look.</p>',
      shortDescription: 'Cushion centre diamond in a double pavé diamond halo.',
      category: engCat._id, basePrice: 2150,
      images: RING_IMGS.cushionHalo,
      metalOptions: [plat, wg18, rg18], variants: sizes('SJ-CHP'),
      style: 'halo', gemstone: 'cushion', settingType: 'halo',
      isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: true,
      deliveryDays: 7, averageRating: 4.8, reviewCount: 74, isActive: true,
    },
    {
      name: 'Six-Claw Knife Edge Solitaire', slug: 'six-claw-knife-edge-solitaire',
      description: '<p>Six secure platinum claws cradle the diamond while the knife-edge band tapers to a sharp ridge, catching light with every movement.</p>',
      shortDescription: 'Six-claw security meets knife-edge elegance.',
      category: engCat._id, basePrice: 1450,
      images: [three_stone_ring, platinum_solitaire],
      metalOptions: [plat, wg18], variants: sizes('SJ-SKE'),
      style: 'solitaire', gemstone: 'round', settingType: 'six-claw',
      isEngravable: true, isFeatured: false, isBestseller: false, isNewArrival: true,
      deliveryDays: 10, averageRating: 4.6, reviewCount: 31, isActive: true,
    },
    {
      name: 'Vintage Floral Diamond Ring', slug: 'vintage-floral-diamond-ring',
      description: '<p>Inspired by Victorian botanicals, our Vintage Floral ring features delicate milgrain detailing, intricate filigree, and a cluster of hand-set diamonds forming a blooming centre.</p>',
      shortDescription: 'Intricate milgrain floral design with diamond cluster.',
      category: engCat._id, basePrice: 2250, salePrice: 1890,
      images: RING_IMGS.vintage,
      metalOptions: [yg18, rg18], variants: sizes('SJ-VFR'),
      style: 'vintage', gemstone: 'round',
      isEngravable: true, isFeatured: true, isBestseller: false, isNewArrival: false,
      deliveryDays: 10, averageRating: 4.9, reviewCount: 56, isActive: true,
    },
    {
      name: 'Cushion Cut Three Stone Ring', slug: 'cushion-cut-three-stone-ring',
      description: '<p>Past, present and future. A cushion-cut centre diamond is flanked by two round brilliant side stones in a classic three-stone setting, symbolising your love story.</p>',
      shortDescription: 'Three-stone ring representing past, present and future.',
      category: engCat._id, basePrice: 3450,
      images: RING_IMGS.threeStone,
      metalOptions: [plat, wg18], variants: sizes('SJ-CTSR'),
      style: 'three-stone', gemstone: 'cushion', settingType: 'three-stone',
      isEngravable: true, isFeatured: true, isBestseller: false, isNewArrival: true,
      deliveryDays: 10, averageRating: 4.7, reviewCount: 38, isActive: true,
    },
    {
      name: 'Pavé Band Solitaire', slug: 'pave-band-solitaire',
      description: '<p>A classic round brilliant diamond sits in a four-claw setting above a band entirely paved with micro-set diamonds. Endless sparkle from every angle.</p>',
      shortDescription: 'Round brilliant diamond above a full pavé diamond band.',
      category: engCat._id, basePrice: 2750,
      images: RING_IMGS.pave,
      metalOptions: [plat, wg18, rg18], variants: sizes('SJ-PBS'),
      style: 'pave', gemstone: 'round', settingType: 'pave',
      isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.8, reviewCount: 62, isActive: true,
    },
    {
      name: 'Emerald Cut East-West Ring', slug: 'emerald-cut-east-west-ring',
      description: '<p>The elongated emerald-cut diamond is set horizontally — east-west — for a bold, architectural statement that is unmistakably modern.</p>',
      shortDescription: 'Emerald cut set east-west for a modern architectural look.',
      category: engCat._id, basePrice: 1650,
      images: RING_IMGS.emeraldCut,
      metalOptions: [wg18, plat, yg18], variants: sizes('SJ-ECEW'),
      style: 'solitaire', gemstone: 'emerald', settingType: 'bezel',
      isEngravable: true, isFeatured: false, isBestseller: false, isNewArrival: true,
      deliveryDays: 14, averageRating: 4.6, reviewCount: 19, isActive: true,
    },
    {
      name: 'Oval Solitaire Knife Edge', slug: 'oval-solitaire-knife-edge',
      description: '<p>An oval brilliant diamond in a four-claw setting, elevated on a slim knife-edge band that catches light beautifully from every direction.</p>',
      shortDescription: 'Elegant oval diamond on a knife-edge platinum band.',
      category: engCat._id, basePrice: 1380,
      images: RING_IMGS.oval,
      metalOptions: [plat, wg18], variants: sizes('SJ-OSK'),
      style: 'solitaire', gemstone: 'oval', settingType: 'four-claw',
      isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.7, reviewCount: 84, isActive: true,
    },
    {
      name: 'Hidden Halo Solitaire', slug: 'hidden-halo-solitaire',
      description: '<p>A secret halo of micro-set diamonds is hidden beneath the centre stone, creating a floating illusion from the side profile while adding extra brilliance.</p>',
      shortDescription: 'Secret halo of micro diamonds beneath the centre stone.',
      category: engCat._id, basePrice: 1950,
      images: [estate_pave, oval_pave_solitaire],
      metalOptions: [plat, wg18, rg18], variants: sizes('SJ-HHS'),
      style: 'halo', gemstone: 'round', settingType: 'hidden-halo',
      isEngravable: true, isFeatured: true, isBestseller: true, isNewArrival: true,
      deliveryDays: 7, averageRating: 4.9, reviewCount: 112, isActive: true,
    },
    {
      name: 'Pear Halo Twist Band', slug: 'pear-halo-twist-band',
      description: '<p>A pear-shaped diamond surrounded by a delicate pavé halo, set above a gently twisted band studded with diamonds. Romantic and distinctive.</p>',
      shortDescription: 'Pear diamond halo above a sparkling twisted band.',
      category: engCat._id, basePrice: 2480,
      images: RING_IMGS.marquise,
      metalOptions: [plat, rg18, wg18], variants: sizes('SJ-PHT'),
      style: 'halo', gemstone: 'pear', settingType: 'halo',
      isEngravable: true, isFeatured: false, isBestseller: false, isNewArrival: true,
      deliveryDays: 10, averageRating: 4.6, reviewCount: 22, isActive: true,
    },

    // ── ETERNITY RINGS ──────────────────────────────────────────────────────
    {
      name: 'Full Eternity Diamond Ring', slug: 'full-diamond-eternity-ring',
      description: '<p>A continuous band of hand-matched round brilliant diamonds set in a shared-claw platinum mount. Every diamond is individually selected for matching colour and clarity.</p>',
      shortDescription: 'Full band of hand-matched GIA-certified round brilliant diamonds.',
      category: eternCat._id, basePrice: 3200,
      images: RING_IMGS.eternity,
      metalOptions: [plat, wg18], variants: sizes('SJ-FDER'),
      style: 'eternity', gemstone: 'round',
      isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: false,
      deliveryDays: 14, averageRating: 4.9, reviewCount: 78, isActive: true,
    },
    {
      name: 'Half Eternity Pavé Ring', slug: 'half-eternity-pave-ring',
      description: '<p>Ten brilliant round diamonds set in a shared-claw mount across the front half of the band, creating a dazzling top while allowing comfortable stacking.</p>',
      shortDescription: 'Ten round brilliants set across the top half of the band.',
      category: eternCat._id, basePrice: 1680,
      images: [eternity_band, gold_band],
      metalOptions: [plat, wg18, yg18], variants: sizes('SJ-HEP'),
      style: 'eternity', gemstone: 'round',
      isEngravable: false, isFeatured: false, isBestseller: true, isNewArrival: false,
      deliveryDays: 10, averageRating: 4.7, reviewCount: 44, isActive: true,
    },
    {
      name: 'Princess Cut Eternity Band', slug: 'princess-cut-eternity-band',
      description: '<p>Geometrically perfect princess-cut diamonds set channel-to-channel in a continuous band of platinum. Clean, modern, and magnificent.</p>',
      shortDescription: 'Princess cuts set flush in a full platinum eternity channel.',
      category: eternCat._id, basePrice: 4200,
      images: [platinum_solitaire, eternity_band],
      metalOptions: [plat, wg18], variants: sizes('SJ-PCEB'),
      style: 'eternity', gemstone: 'princess',
      isEngravable: false, isFeatured: true, isBestseller: false, isNewArrival: true,
      deliveryDays: 14, averageRating: 4.8, reviewCount: 29, isActive: true,
    },

    // ── WEDDING RINGS / BANDS ───────────────────────────────────────────────
    {
      name: 'Court Shaped Wedding Band', slug: 'court-shaped-wedding-band',
      description: '<p>Our best-selling wedding band. The court shape features a rounded exterior and a flat or slightly curved interior — the most comfortable style for daily wear.</p>',
      shortDescription: 'Comfortable court-shaped band — our most popular style.',
      category: weddCat._id, basePrice: 425,
      images: RING_IMGS.band,
      metalOptions: [plat, yg18, wg18, rg18],
      variants: ['M','N','O','P','Q','R','S','T','U','V','W','X'].map(s => ({ size: s, stock: 10, sku: `SJ-CSWB-${s}` })),
      style: 'court', isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.8, reviewCount: 312, isActive: true,
    },
    {
      name: 'D-Shape Platinum Band', slug: 'd-shape-platinum-band',
      description: '<p>The D-shape profile has a flat inner surface for maximum comfort and a rounded exterior — a contemporary favourite for both men and women.</p>',
      shortDescription: 'Flat inner, rounded outer — the ultimate modern comfort band.',
      category: weddCat._id, basePrice: 545,
      images: [gold_band, traditional_band],
      metalOptions: [plat, wg18], variants: sizes('SJ-DSPB'),
      style: 'd-shape', isEngravable: true, isFeatured: false, isBestseller: false, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.6, reviewCount: 87, isActive: true,
    },
    {
      name: 'Diamond-Set Twist Band', slug: 'diamond-set-twist-band',
      description: '<p>A gently twisted band set with a continuous row of brilliant round diamonds along the outer edge. Perfect as a standalone band or stacked with an engagement ring.</p>',
      shortDescription: 'Twisted band set with continuous round brilliant diamonds.',
      category: weddCat._id, basePrice: 1100,
      images: RING_IMGS.twoRow,
      metalOptions: [plat, wg18, yg18], variants: sizes('SJ-DTB'),
      style: 'twist', gemstone: 'round', isEngravable: false, isFeatured: true, isBestseller: false, isNewArrival: true,
      deliveryDays: 10, averageRating: 4.7, reviewCount: 41, isActive: true,
    },
    {
      name: 'Channel Set Diamond Band', slug: 'channel-set-diamond-band',
      description: '<p>Round brilliant diamonds set in a flush channel running the full circumference of the band. Protected and secure, yet brilliantly bright.</p>',
      shortDescription: 'Full channel of round brilliants set flush around the band.',
      category: weddCat._id, basePrice: 1450,
      images: RING_IMGS.channel,
      metalOptions: [plat, wg18], variants: sizes('SJ-CSDB'),
      style: 'channel', gemstone: 'round',
      isEngravable: false, isFeatured: true, isBestseller: true, isNewArrival: false,
      deliveryDays: 10, averageRating: 4.8, reviewCount: 93, isActive: true,
    },
    {
      name: "Men's Flat Court Band", slug: 'mens-flat-court-band',
      description: "<p>A bold, masculine flat court band with a substantial profile. Available in a range of widths from 4mm to 8mm. The go-to wedding band for men.</p>",
      shortDescription: "Bold flat-court profile in 4mm to 8mm widths.",
      category: weddCat._id, basePrice: 395,
      images: RING_IMGS.mens,
      metalOptions: [plat, yg18, wg18],
      variants: ['P','Q','R','S','T','U','V','W','X','Y','Z'].map(s => ({ size: s, stock: 8, sku: `SJ-MFC-${s}` })),
      style: 'flat-court', isEngravable: true, isFeatured: false, isBestseller: true, isNewArrival: false,
      deliveryDays: 7, averageRating: 4.7, reviewCount: 203, isActive: true,
    },
  ]);
  console.log('✓ 20 ring products seeded');

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

  const productCount = await Product.countDocuments();
  console.log('\n🎉 Seed complete!');
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${productCount} products`);
  console.log(`   - ${diamondData.length} diamonds (10 shapes)`);
  console.log('   - 1 admin user');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
