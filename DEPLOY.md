# Sterling Jewellers — Deployment Guide
## Netlify (Frontend) + Render (Backend)

---

## Before you start — what you need

| Service | What for | Free tier? |
|---------|----------|------------|
| [GitHub](https://github.com) | Host your code | ✅ Yes |
| [Netlify](https://netlify.com) | Host the Next.js frontend | ✅ Yes |
| [Render](https://render.com) | Host the Express API | ✅ Yes (with sleep) |
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | ✅ Yes (512 MB) |
| [Stripe](https://stripe.com) | Payments | ✅ Test mode free |
| [Cloudinary](https://cloudinary.com) | Image hosting | ✅ Free tier |

---

## Step 1 — Push to GitHub

```bash
# From the Sterling_Jewellers root folder:
git remote add origin https://github.com/YOUR_USERNAME/sterling-jewellers.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy the Backend on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `sterling-jewellers-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Region:** Frankfurt (closest to UK)

4. In the **Environment** tab, add these variables:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://...          ← your Atlas URI
JWT_SECRET=<generate 64 random chars>
JWT_EXPIRES_IN=30d
CLIENT_URL=https://YOUR-SITE.netlify.app   ← fill after Netlify deploy
STRIPE_SECRET_KEY=sk_live_...         ← or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@sterlingjewellers.co.uk
```

5. Click **Deploy** — wait ~3 minutes
6. Note your Render URL: `https://sterling-jewellers-api.onrender.com`
7. Test: `https://sterling-jewellers-api.onrender.com/api/health` → should return `{"status":"OK"}`

---

## Step 3 — Deploy the Frontend on Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Choose your GitHub repo
3. Configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/.next`

4. In **Site Settings → Environment Variables**, add:

```
NEXT_PUBLIC_API_URL=https://sterling-jewellers-api.onrender.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   ← or pk_test_... for testing
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
NEXTAUTH_URL=https://your-site.netlify.app
NEXTAUTH_SECRET=<generate 32 random chars>
```

5. Click **Deploy** — wait ~4 minutes
6. Note your Netlify URL: `https://sterling-jewellers.netlify.app`

---

## Step 4 — Connect them together

1. **Back on Render** → your service → Environment → update:
   ```
   CLIENT_URL=https://sterling-jewellers.netlify.app
   ```
   → Save → Render will redeploy automatically

2. **Back on Netlify** → Deploys → **Trigger deploy** to refresh with the correct API URL

---

## Step 5 — Set up Stripe Webhook (important for payments!)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://sterling-jewellers-api.onrender.com/api/payment/webhook`
4. **Events to listen to:** `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)
6. On Render → update `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Step 6 — Custom Domain (optional)

### On Netlify:
1. **Site Settings → Domain Management → Add custom domain**
2. Enter: `sterlingjewellers.co.uk`
3. Follow the DNS instructions (add CNAME/A records in your domain registrar)
4. Netlify auto-provisions SSL (Let's Encrypt)

### After adding the domain, update:
- Netlify env: `NEXT_PUBLIC_SITE_URL=https://sterlingjewellers.co.uk`
- Netlify env: `NEXTAUTH_URL=https://sterlingjewellers.co.uk`
- Render env: `CLIENT_URL=https://sterlingjewellers.co.uk`

---

## Step 7 — Seed initial data (first time only)

```bash
# Run from your local machine with the production MONGO_URI:
cd server
MONGO_URI="mongodb+srv://..." npm run seed
```

---

## Quick reference — environment variables

### Server (.env / Render)
| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | 64-character random string |
| `CLIENT_URL` | `https://your-site.netlify.app` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary console |
| `CLOUDINARY_API_KEY` | from Cloudinary console |
| `CLOUDINARY_API_SECRET` | from Cloudinary console |
| `SENDGRID_API_KEY` | `SG.xxx` |
| `FROM_EMAIL` | `noreply@sterlingjewellers.co.uk` |

### Client (.env.local / Netlify)
| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://sterling-jewellers-api.onrender.com/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_SITE_URL` | `https://sterlingjewellers.co.uk` |
| `NEXTAUTH_URL` | `https://sterlingjewellers.co.uk` |
| `NEXTAUTH_SECRET` | 32-character random string |

---

## Troubleshooting

**API returns CORS error?**
→ Check `CLIENT_URL` on Render matches your Netlify URL exactly (no trailing slash)

**Stripe payment fails?**
→ Check webhook is set up (Step 5) and `STRIPE_WEBHOOK_SECRET` is correct

**Images not loading?**
→ Add your image hostname to `next.config.js` → `images.remotePatterns`

**Render goes to sleep after 15 min (free tier)?**
→ Upgrade to Render Starter ($7/mo) or use a cron ping service like [cron-job.org](https://cron-job.org) to ping `/api/health` every 10 minutes

**Build fails on Netlify?**
→ Check that `@netlify/plugin-nextjs` is in `client/package.json` devDependencies

---

## Generate random secrets quickly

```bash
# JWT_SECRET (64 chars):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# NEXTAUTH_SECRET (32 chars):
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
