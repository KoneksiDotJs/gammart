/**
 * Email templates for Gammart transactional emails.
 * All templates return a { subject, html } object.
 * Designed to render cleanly in Gmail, Outlook, and mobile clients.
 */

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

// ─── Shared layout wrapper ────────────────────────────────────────────────────

const layout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gammart</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#16a34a;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:bold;line-height:32px;">G</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:18px;font-weight:700;vertical-align:middle;">
                    Gammart
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1e293b;border-radius:16px;border:1px solid #334155;padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;color:#475569;font-size:12px;line-height:1.6;">
              <p style="margin:0;">You're receiving this because you have an account on Gammart.</p>
              <p style="margin:4px 0 0;">© ${new Date().getFullYear()} Gammart. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const divider = `<div style="border-top:1px solid #334155;margin:24px 0;"></div>`

const button = (href: string, label: string) => `
  <div style="text-align:center;margin-top:28px;">
    <a href="${href}"
       style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
              font-weight:600;font-size:14px;padding:12px 32px;border-radius:10px;">
      ${label}
    </a>
  </div>
`

const metaRow = (label: string, value: string) => `
  <tr>
    <td style="color:#94a3b8;font-size:13px;padding:4px 0;width:40%;">${label}</td>
    <td style="color:#e2e8f0;font-size:13px;padding:4px 0;font-weight:500;">${value}</td>
  </tr>
`

// ─── Template 1: New order — notify seller ────────────────────────────────────

export interface NewOrderEmailParams {
  sellerName: string
  buyerName: string
  productTitle: string
  productGame: string
  orderId: string
  amount: number
  paymentMethod: string
  notes?: string
  orderUrl: string
}

export const newOrderEmail = (p: NewOrderEmailParams) => ({
  subject: `🛒 New order: ${p.productTitle}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">
      You have a new order!
    </h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
      Hi ${p.sellerName}, <strong style="color:#e2e8f0;">${p.buyerName}</strong>
      has placed an order for one of your listings.
    </p>

    <!-- Product highlight -->
    <div style="background:#0f172a;border-radius:10px;border:1px solid #334155;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Product</p>
      <p style="margin:0 0 4px;color:#fff;font-size:15px;font-weight:600;">${p.productTitle}</p>
      <p style="margin:0;color:#22c55e;font-size:13px;">${p.productGame}</p>
    </div>

    <!-- Order details -->
    <table cellpadding="0" cellspacing="0" width="100%">
      ${metaRow('Order ID', `#${p.orderId.slice(-8).toUpperCase()}`)}
      ${metaRow('Amount', formatPrice(p.amount))}
      ${metaRow('Payment method', p.paymentMethod)}
      ${metaRow('Buyer', p.buyerName)}
      ${p.notes ? metaRow('Buyer notes', `"${p.notes}"`) : ''}
    </table>

    ${divider}

    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
      ⚡ Once payment is confirmed, you'll receive another notification to deliver the product.
      Keep an eye on your dashboard.
    </p>

    ${button(p.orderUrl, 'View Order')}
  `),
})

// ─── Template 2: Payment confirmed — remind seller to deliver ─────────────────

export interface PaymentConfirmedSellerEmailParams {
  sellerName: string
  buyerName: string
  productTitle: string
  orderId: string
  amount: number
  notes?: string
  orderUrl: string
}

export const paymentConfirmedSellerEmail = (p: PaymentConfirmedSellerEmailParams) => ({
  subject: `✅ Payment received — deliver now: ${p.productTitle}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">
      Payment confirmed!
    </h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
      Hi ${p.sellerName}, the payment for your order has been verified.
      Please deliver the product to <strong style="color:#e2e8f0;">${p.buyerName}</strong> now.
    </p>

    <div style="background:#0f172a;border-radius:10px;border:1px solid #334155;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order</p>
      <p style="margin:0 0 4px;color:#fff;font-size:15px;font-weight:600;">${p.productTitle}</p>
      <p style="margin:0;color:#22c55e;font-size:15px;font-weight:700;">${formatPrice(p.amount)}</p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%">
      ${metaRow('Order ID', `#${p.orderId.slice(-8).toUpperCase()}`)}
      ${metaRow('Buyer', p.buyerName)}
      ${p.notes ? metaRow('Buyer notes', `"${p.notes}"`) : ''}
    </table>

    ${divider}

    <p style="color:#f59e0b;font-size:13px;margin:0;">
      ⚠️ Deliver the product and click "Mark as Delivered" in your dashboard.
      Delays may result in a dispute being opened.
    </p>

    ${button(p.orderUrl, 'Go to Order')}
  `),
})

// ─── Template 3: Order delivered — notify buyer ───────────────────────────────

export interface OrderDeliveredBuyerEmailParams {
  buyerName: string
  sellerName: string
  productTitle: string
  productGame: string
  orderId: string
  amount: number
  orderUrl: string
}

export const orderDeliveredBuyerEmail = (p: OrderDeliveredBuyerEmailParams) => ({
  subject: `🎮 Your order has been delivered: ${p.productTitle}`,
  html: layout(`
    <h2 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:700;">
      Your order is complete!
    </h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
      Hi ${p.buyerName}, <strong style="color:#e2e8f0;">${p.sellerName}</strong>
      has marked your order as delivered. Enjoy your purchase!
    </p>

    <!-- Product highlight -->
    <div style="background:#052e16;border-radius:10px;border:1px solid #166534;padding:16px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="background:#16a34a;width:40px;height:40px;border-radius:8px;text-align:center;line-height:40px;font-size:20px;flex-shrink:0;">
          🎮
        </div>
        <div>
          <p style="margin:0 0 2px;color:#fff;font-size:14px;font-weight:600;">${p.productTitle}</p>
          <p style="margin:0;color:#22c55e;font-size:12px;">${p.productGame}</p>
        </div>
      </div>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%">
      ${metaRow('Order ID', `#${p.orderId.slice(-8).toUpperCase()}`)}
      ${metaRow('Amount paid', formatPrice(p.amount))}
      ${metaRow('Seller', p.sellerName)}
    </table>

    ${divider}

    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
      💬 Happy with your purchase? Leave a review to help other buyers and reward great sellers.
    </p>

    ${button(p.orderUrl, 'View Order & Leave Review')}
  `),
})