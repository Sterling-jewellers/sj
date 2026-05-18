import nodemailer, { Transporter } from 'nodemailer';

/* ── Transporter (Gmail SMTP) ──────────────────────────────────────────────── */
let transporter: Transporter;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,          // TLS via STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Gmail App Password (16 chars)
    },
  });
  return transporter;
}

/* ── Base layout ───────────────────────────────────────────────────────────── */
function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;500;600&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{background:#F5F3EE;font-family:'Inter',Arial,sans-serif;color:#2C2C2C;}
    .wrapper{max-width:620px;margin:32px auto;background:#fff;}
    .header{background:#2C2C2C;padding:28px 40px;text-align:center;}
    .header .brand{color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;}
    .header .sub{color:#C9A96E;font-size:9px;letter-spacing:0.46em;text-transform:uppercase;margin-top:4px;}
    .gold-bar{height:3px;background:linear-gradient(90deg,#C9A96E,#E8C98A,#C9A96E);}
    .body{padding:40px;}
    .greeting{font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:400;color:#2C2C2C;margin-bottom:8px;}
    .intro{font-size:14px;color:#666;line-height:1.7;margin-bottom:28px;}
    .order-box{border:1px solid #E8E0D6;padding:20px 24px;margin-bottom:24px;background:#FDFBF8;}
    .order-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:0;}
    .meta-item{}
    .meta-label{font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#999;font-weight:600;margin-bottom:3px;}
    .meta-value{font-size:14px;font-weight:600;color:#2C2C2C;}
    .divider{border:none;border-top:1px solid #EEE8E0;margin:20px 0;}
    .items-table{width:100%;border-collapse:collapse;}
    .items-table th{font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#999;font-weight:600;padding:8px 0;text-align:left;border-bottom:1px solid #EEE8E0;}
    .items-table td{font-size:13px;color:#444;padding:12px 0;border-bottom:1px solid #F5F1EB;vertical-align:top;}
    .items-table td.right{text-align:right;color:#2C2C2C;font-weight:600;}
    .item-name{font-weight:600;color:#2C2C2C;margin-bottom:2px;}
    .item-meta{font-size:11px;color:#999;}
    .summary-table{width:100%;border-collapse:collapse;margin-top:4px;}
    .summary-table td{font-size:13px;padding:5px 0;color:#666;}
    .summary-table td.right{text-align:right;}
    .summary-table tr.total td{font-size:15px;font-weight:700;color:#2C2C2C;border-top:1px solid #EEE8E0;padding-top:10px;margin-top:6px;}
    .summary-table tr.discount td{color:#2E7D32;}
    .btn{display:inline-block;background:#C9A96E;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;padding:14px 32px;margin-top:4px;}
    .btn-outline{display:inline-block;border:1px solid #C9A96E;color:#C9A96E;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;padding:13px 32px;}
    .address-box{background:#F9F7F4;border-left:3px solid #C9A96E;padding:16px 20px;font-size:13px;line-height:1.8;color:#555;}
    .address-box strong{color:#2C2C2C;display:block;margin-bottom:2px;}
    .status-badge{display:inline-block;padding:6px 14px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;border-radius:2px;}
    .status-confirmed{background:#EBF4FF;color:#1565C0;}
    .status-processing{background:#EBF4FF;color:#1565C0;}
    .status-dispatched{background:#F3E5F5;color:#6A1B9A;}
    .status-delivered{background:#E8F5E9;color:#2E7D32;}
    .status-cancelled{background:#FFEBEE;color:#C62828;}
    .tracking-box{background:#F3E5F5;border:1px solid #E1BEE7;padding:16px 20px;margin:20px 0;}
    .tracking-box .track-label{font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#6A1B9A;font-weight:700;margin-bottom:6px;}
    .tracking-box .track-num{font-size:18px;font-weight:700;color:#4A148C;letter-spacing:0.06em;}
    .footer{background:#F5F3EE;padding:24px 40px;text-align:center;}
    .footer p{font-size:11px;color:#999;line-height:1.8;}
    .footer a{color:#C9A96E;text-decoration:none;}
    .highlight{color:#C9A96E;font-weight:600;}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">Sterling</div>
      <div class="sub">Jewellers</div>
    </div>
    <div class="gold-bar"></div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>Sterling Jewellers Limited &nbsp;·&nbsp; +44 742 906 5954</p>
      <p><a href="mailto:sterlingjewellerslimited@gmail.com">sterlingjewellerslimited@gmail.com</a></p>
      <p style="margin-top:10px;font-size:10px;color:#bbb;">You received this email because you have an account or placed an order with Sterling Jewellers.<br/>© ${new Date().getFullYear()} Sterling Jewellers Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface OrderEmailItem {
  name: string;
  image?: string;
  price: number;
  quantity: number;
  selectedMetal?: string;
  selectedSize?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  orderId: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingMethod: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
    phone?: string;
  };
  estimatedDelivery?: Date | string;
  trackingNumber?: string;
  trackingUrl?: string;
  orderStatus?: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function formatPrice(n: number): string {
  return `£${Number(n).toFixed(2)}`;
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildItemsRows(items: OrderEmailItem[]): string {
  return items.map(item => `
    <tr>
      <td>
        <div class="item-name">${item.name}</div>
        <div class="item-meta">
          ${item.selectedMetal ? `Metal: ${item.selectedMetal}` : ''}
          ${item.selectedMetal && item.selectedSize ? ' &nbsp;·&nbsp; ' : ''}
          ${item.selectedSize ? `Size: ${item.selectedSize}` : ''}
        </div>
      </td>
      <td style="text-align:center;color:#666;">${item.quantity}</td>
      <td class="right">${formatPrice(item.price * item.quantity)}</td>
    </tr>`).join('');
}

function buildSummaryRows(data: OrderEmailData): string {
  const rows = [];
  rows.push(`<tr><td>Subtotal</td><td class="right">${formatPrice(data.subtotal)}</td></tr>`);
  if (data.discount > 0) {
    rows.push(`<tr class="discount"><td>Discount</td><td class="right">−${formatPrice(data.discount)}</td></tr>`);
  }
  rows.push(`<tr><td>Shipping</td><td class="right">${data.shippingCost === 0 ? 'Free' : formatPrice(data.shippingCost)}</td></tr>`);
  rows.push(`<tr><td>VAT (20%)</td><td class="right">${formatPrice(data.tax)}</td></tr>`);
  rows.push(`<tr class="total"><td>Total</td><td class="right">${formatPrice(data.total)}</td></tr>`);
  return rows.join('');
}

function buildAddressBlock(addr: OrderEmailData['shippingAddress']): string {
  const lines = [addr.line1, addr.line2, addr.city, addr.county, addr.postcode, addr.country].filter(Boolean).join(', ');
  return `<div class="address-box">
    <strong>${addr.fullName}</strong>
    ${lines}${addr.phone ? `<br/><span style="color:#999;font-size:12px;">${addr.phone}</span>` : ''}
  </div>`;
}

/* ════════════════════════════════════════════════════════════════════════════
   1. ORDER CONFIRMATION
   ════════════════════════════════════════════════════════════════════════════ */
export async function sendOrderConfirmation(toEmail: string, firstName: string, data: OrderEmailData): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'https://sjclients.netlify.app';
  const orderUrl  = `${clientUrl}/account/orders/${data.orderId}`;

  const body = `
    <p class="greeting">Thank you, ${firstName}!</p>
    <p class="intro">Your order has been confirmed. We're getting it ready for you — you'll receive another email once it's dispatched.</p>

    <div class="order-box">
      <div class="order-meta">
        <div class="meta-item">
          <div class="meta-label">Order Number</div>
          <div class="meta-value">${data.orderNumber}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="status-badge status-confirmed">Confirmed</span></div>
        </div>
        ${data.estimatedDelivery ? `
        <div class="meta-item">
          <div class="meta-label">Est. Delivery</div>
          <div class="meta-value">${formatDate(data.estimatedDelivery)}</div>
        </div>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${buildItemsRows(data.items)}
      </tbody>
    </table>

    <table class="summary-table" style="margin-top:16px;">
      <tbody>${buildSummaryRows(data)}</tbody>
    </table>

    <hr class="divider" />

    <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#999;font-weight:600;margin-bottom:10px;">Delivery Address</p>
    ${buildAddressBlock(data.shippingAddress)}

    <div style="margin-top:28px;">
      <a href="${orderUrl}" class="btn">Track My Order</a>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"Sterling Jewellers" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Order Confirmed — ${data.orderNumber}`,
    html: baseLayout(`Order Confirmed — ${data.orderNumber}`, body),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   2. ORDER STATUS UPDATE  (dispatched / delivered / cancelled / etc.)
   ════════════════════════════════════════════════════════════════════════════ */
const STATUS_META: Record<string, { subject: string; heading: string; intro: string; badgeClass: string }> = {
  processing: {
    subject: 'Your order is being prepared',
    heading: 'We\'re preparing your order',
    intro:   'Our team is carefully preparing your jewellery. We\'ll notify you as soon as it\'s on its way.',
    badgeClass: 'status-processing',
  },
  dispatched: {
    subject: 'Your order is on its way! 🚚',
    heading: 'Your order has been dispatched',
    intro:   'Great news — your order has left our workshop and is on its way to you.',
    badgeClass: 'status-dispatched',
  },
  delivered: {
    subject: 'Your order has been delivered ✨',
    heading: 'Your order was delivered',
    intro:   'We hope you love your new piece! If you have any questions or concerns, please don\'t hesitate to get in touch.',
    badgeClass: 'status-delivered',
  },
  cancelled: {
    subject: 'Your order has been cancelled',
    heading: 'Order Cancelled',
    intro:   'Your order has been cancelled. If you believe this is a mistake or have questions, please contact us.',
    badgeClass: 'status-cancelled',
  },
};

export async function sendOrderStatusUpdate(toEmail: string, firstName: string, data: OrderEmailData): Promise<void> {
  const status    = data.orderStatus ?? 'processing';
  const meta      = STATUS_META[status] ?? STATUS_META.processing;
  const clientUrl = process.env.CLIENT_URL || 'https://sjclients.netlify.app';
  const orderUrl  = `${clientUrl}/account/orders/${data.orderId}`;

  const trackingBlock = data.trackingNumber ? `
    <div class="tracking-box">
      <div class="track-label">Tracking Number</div>
      <div class="track-num">${data.trackingNumber}</div>
      ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="display:inline-block;margin-top:10px;font-size:11px;color:#6A1B9A;font-weight:600;text-decoration:none;">Track your parcel →</a>` : ''}
    </div>` : '';

  const body = `
    <p class="greeting">${meta.heading}</p>
    <p class="intro">Hi ${firstName}, ${meta.intro}</p>

    <div class="order-box">
      <div class="order-meta">
        <div class="meta-item">
          <div class="meta-label">Order Number</div>
          <div class="meta-value">${data.orderNumber}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="status-badge ${meta.badgeClass}">${status}</span></div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total</div>
          <div class="meta-value">${formatPrice(data.total)}</div>
        </div>
      </div>
    </div>

    ${trackingBlock}

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${buildItemsRows(data.items)}</tbody>
    </table>

    <div style="margin-top:28px;">
      <a href="${orderUrl}" class="btn">View Order Details</a>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"Sterling Jewellers" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${meta.subject} — ${data.orderNumber}`,
    html: baseLayout(meta.subject, body),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   3. WELCOME EMAIL
   ════════════════════════════════════════════════════════════════════════════ */
export async function sendWelcomeEmail(toEmail: string, firstName: string): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'https://sjclients.netlify.app';

  const body = `
    <p class="greeting">Welcome to Sterling Jewellers, ${firstName}!</p>
    <p class="intro">
      We're delighted to have you as part of the Sterling family. Your account is now set up and ready to go.
      Here's what you can do with your account:
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      ${[
        ['🛍️', 'Browse & Order',      'Shop our full collection of rings, jewellery &amp; diamonds.'],
        ['📦', 'Track Your Orders',   'Follow your orders from confirmation to delivery.'],
        ['❤️', 'Wishlist',            'Save pieces you love and revisit them anytime.'],
        ['📍', 'Saved Addresses',     'Checkout faster with your saved delivery addresses.'],
      ].map(([icon, title, desc]) => `
      <tr>
        <td style="width:40px;font-size:20px;padding:10px 0;vertical-align:top;">${icon}</td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #F0EBE3;">
          <div style="font-weight:600;font-size:13px;color:#2C2C2C;margin-bottom:3px;">${title}</div>
          <div style="font-size:12px;color:#888;">${desc}</div>
        </td>
      </tr>`).join('')}
    </table>

    <a href="${clientUrl}/category/jewellery" class="btn">Start Shopping</a>
    &nbsp;&nbsp;
    <a href="${clientUrl}/account" class="btn-outline">My Account</a>
  `;

  await getTransporter().sendMail({
    from: `"Sterling Jewellers" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Welcome to Sterling Jewellers ✨',
    html: baseLayout('Welcome to Sterling Jewellers', body),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   4. PASSWORD RESET
   ════════════════════════════════════════════════════════════════════════════ */
export async function sendPasswordResetEmail(toEmail: string, firstName: string, resetToken: string): Promise<void> {
  const clientUrl  = process.env.CLIENT_URL || 'https://sjclients.netlify.app';
  const resetUrl   = `${clientUrl}/reset-password/${resetToken}`;

  const body = `
    <p class="greeting">Reset Your Password</p>
    <p class="intro">
      Hi ${firstName}, we received a request to reset the password for your Sterling Jewellers account.
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>

    <p style="font-size:12px;color:#999;line-height:1.7;background:#F9F7F4;padding:16px;border-left:3px solid #E8E0D6;">
      If you didn't request this, you can safely ignore this email — your password won't be changed.<br/>
      For security, this link will expire in 1 hour.
    </p>

    <p style="font-size:11px;color:#BBB;margin-top:20px;">
      Or copy this URL into your browser:<br/>
      <span style="color:#C9A96E;word-break:break-all;">${resetUrl}</span>
    </p>
  `;

  await getTransporter().sendMail({
    from: `"Sterling Jewellers" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset Your Password — Sterling Jewellers',
    html: baseLayout('Reset Your Password', body),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   5. NEWSLETTER WELCOME
   ════════════════════════════════════════════════════════════════════════════ */
export async function sendNewsletterWelcome(toEmail: string): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'https://sjclients.netlify.app';

  const body = `
    <p class="greeting">Welcome to the Sterling Family! ✨</p>
    <p class="intro">
      Thank you for subscribing to the Sterling Jewellers newsletter. We're thrilled to have you with us.
      Get ready for exclusive access to new collections, special offers, and fine jewellery insights delivered straight to your inbox.
    </p>

    <div class="order-box" style="text-align:center;padding:28px 24px;">
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:36px;color:#C9A96E;font-weight:400;margin-bottom:8px;">10%</div>
      <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#2C2C2C;margin-bottom:4px;">OFF YOUR FIRST ORDER</div>
      <div style="font-size:12px;color:#999;margin-bottom:16px;">Use code at checkout</div>
      <div style="display:inline-block;background:#2C2C2C;color:#C9A96E;font-size:18px;font-weight:700;letter-spacing:0.22em;padding:10px 28px;border:1px solid #C9A96E;">STERLING10</div>
    </div>

    <p style="font-size:13px;color:#666;line-height:1.7;margin:20px 0 8px;">Here's what to expect from us:</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      ${[
        ['💎', 'New Collections',    'Be first to discover our latest fine jewellery pieces.'],
        ['🎁', 'Exclusive Offers',   'Members-only discounts and early access to sales.'],
        ['✨', 'Jewellery Insights', 'Care tips, style guides, and expert advice.'],
      ].map(([icon, title, desc]) => `
      <tr>
        <td style="width:40px;font-size:20px;padding:10px 0;vertical-align:top;">${icon}</td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #F0EBE3;">
          <div style="font-weight:600;font-size:13px;color:#2C2C2C;margin-bottom:3px;">${title}</div>
          <div style="font-size:12px;color:#888;">${desc}</div>
        </td>
      </tr>`).join('')}
    </table>

    <a href="${clientUrl}/category/jewellery" class="btn">Explore Collections</a>

    <p style="font-size:11px;color:#BBB;margin-top:24px;line-height:1.7;">
      You're receiving this because you subscribed at sterlingjewellers.co.uk.<br/>
      <a href="${clientUrl}/unsubscribe" style="color:#C9A96E;">Unsubscribe</a> anytime.
    </p>
  `;

  await getTransporter().sendMail({
    from: `"Sterling Jewellers" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Welcome to Sterling Jewellers ✨ — You\'re in!',
    html: baseLayout('Welcome to Sterling Jewellers', body),
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   6. ADMIN — NEW ORDER NOTIFICATION
   ════════════════════════════════════════════════════════════════════════════ */
export async function sendAdminNewOrderNotification(data: OrderEmailData, customerEmail: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return;

  const clientUrl  = process.env.CLIENT_URL || 'https://sjclients.netlify.app';
  const adminUrl   = `${clientUrl}/admin/orders`;

  const body = `
    <p class="greeting">New Order Received</p>
    <p class="intro">A new order has been placed on the store.</p>

    <div class="order-box">
      <div class="order-meta">
        <div class="meta-item">
          <div class="meta-label">Order Number</div>
          <div class="meta-value">${data.orderNumber}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Customer</div>
          <div class="meta-value">${data.shippingAddress.fullName}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Email</div>
          <div class="meta-value" style="font-size:12px;">${customerEmail}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total</div>
          <div class="meta-value highlight">${formatPrice(data.total)}</div>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${buildItemsRows(data.items)}</tbody>
    </table>

    <table class="summary-table" style="margin-top:16px;">
      <tbody>${buildSummaryRows(data)}</tbody>
    </table>

    <div style="margin-top:24px;">
      <a href="${adminUrl}" class="btn">View in Admin</a>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"Sterling Jewellers Orders" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `🛍️ New Order — ${data.orderNumber} — ${formatPrice(data.total)}`,
    html: baseLayout('New Order Notification', body),
  });
}
