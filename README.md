# Sterling Jewellers Ltd — Full Stack Web Application

A luxury jewellery e-commerce platform built with Next.js 14, Express.js, and MongoDB.

---

## Project Structure

```
Sterling_Jewellers/
├── client/          # Next.js 14 frontend
└── server/          # Express.js REST API backend
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### 2. Install dependencies
```bash
npm install         # root
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment variables

**Server** — edit `/server/.env`:
```
MONGO_URI=mongodb://localhost:27017/sterling_jewellers
JWT_SECRET=your_secret_here
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Client** — edit `/client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Seed the database
```bash
cd server
npm run seed
```
This creates: 8 products, 60 diamonds, 5 categories, and an admin user.

**Admin credentials:**
- Email: `admin@sterlingjewellers.co.uk`
- Password: `Admin@123`

### 5. Run in development
```bash
# From root — runs both server and client concurrently
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage (Hero, Categories, Featured Products) |
| `/products` | Product listing with filters & sorting |
| `/products/[slug]` | Product detail page |
| `/category/[slug]` | Category pages |
| `/diamonds` | Diamond search engine (filterable table) |
| `/custom-ring` | 3-step Ring Builder |
| `/cart` | Cart (drawer + redirect) |
| `/checkout` | Checkout with Stripe |
| `/checkout/success` | Order confirmation |
| `/account` | User dashboard |
| `/account/orders` | Order history |
| `/sign-in` | Login |
| `/sign-up` | Register |
| `/about` | About page |
| `/contact` | Contact form |
| `/faq` | FAQ accordion |
| `/size-guide` | Ring size conversion chart |
| `/admin/dashboard` | Admin dashboard with analytics |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/products` | Get products (with filters) |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/:slug` | Single product |
| GET | `/api/diamonds` | Diamond search |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/my-orders` | User's orders |
| POST | `/api/payment/create-intent` | Stripe payment intent |
| POST | `/api/payment/validate-coupon` | Validate coupon code |
| GET | `/api/admin/dashboard` | Admin stats |

---

## Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query, React Hook Form, Framer Motion, Lucide Icons

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Stripe, Cloudinary, Multer

---

## Features

- Luxury jewellery e-commerce with Abelini-inspired design
- Product catalog with advanced filtering & sorting
- 3-step Ring Builder (choose setting → diamond → review)
- Diamond search engine with 10k+ SKU support
- Persistent cart with Zustand
- Full checkout flow with Stripe
- User authentication (JWT)
- Admin dashboard with revenue charts
- Wishlist management
- Product reviews system
- SEO optimised (metadata, structured data ready)
- Mobile responsive
- Database seeder with sample data
