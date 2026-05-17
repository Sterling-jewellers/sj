// ⚠️ dotenv MUST be called before any other imports that read process.env
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import diamondRoutes from './routes/diamond.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import reviewRoutes from './routes/review.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import goldPriceRoutes from './routes/goldprice.routes';
import analyticsRoutes from './routes/analytics.routes';
import * as XLSX from 'xlsx';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Render/proxy headers (needed for rate limiting and HTTPS detection)
app.set('trust proxy', 1);

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to load cross-origin
}));

// CORS — allow localhost in dev, Netlify URL in production
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((o) => origin === o || origin.endsWith('.netlify.app'))) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// GLB proxy — public, no auth. Meshy CDN (CloudFront) has no CORS headers,
// so GLTFLoader can't fetch GLBs directly from the browser. We pipe here.
app.get('/api/glb-proxy', async (req, res) => {
  const glbUrl = req.query.url as string;
  if (!glbUrl || !glbUrl.startsWith('https://')) {
    res.status(400).json({ message: 'url query param required' }); return;
  }
  try {
    const upstream = await fetch(glbUrl);
    if (!upstream.ok) { res.status(502).json({ message: `Upstream ${upstream.status}` }); return; }
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (e) {
    res.status(502).json({ message: (e as Error).message });
  }
});

// Public template download — no auth needed (it's just column headers)
app.get('/api/import-template', (_req, res) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['name','categoryId','basePrice','salePrice','competitorPrice','shortDescription','description','style','gemstone','settingType','metalType','karat','images','tags','deliveryDays'],
    ['Classic Round Solitaire','<paste category _id here>','850','','1200','Elegant round brilliant diamond ring','<p>A timeless solitaire ring crafted in 18ct platinum.</p>','solitaire','round','four-claw','platinum','18ct','https://example.com/image.jpg','engagement,solitaire,classic','7'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="sterling-import-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/diamonds', diamondRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/goldprice', goldPriceRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
