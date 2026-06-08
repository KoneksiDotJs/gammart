import { Resend } from 'resend'
import { env } from '../config/env'
import {
  newOrderEmail,
  NewOrderEmailParams,
  paymentConfirmedSellerEmail,
  PaymentConfirmedSellerEmailParams,
  orderDeliveredBuyerEmail,
  OrderDeliveredBuyerEmailParams,
} from '../utils/emailTemplates'

const resend = new Resend(env.email.resendApiKey)

/**
 * Low-level send helper.
 * Never throws — email failures are logged but never crash the main flow.
 */
const send = async (to: string, subject: string, html: string): Promise<void> => {
  if (!env.email.resendApiKey) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email to', to)
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: env.email.from,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Resend error:', error)
    } else {
      console.log(`[Email] Sent "${subject}" → ${to}`)
    }
  } catch (err) {
    console.error('[Email] Unexpected error:', err)
  }
}

export const emailService = {
  /**
   * Notify seller when a new order is placed on their product.
   * Fired immediately after order creation, before payment.
   */
  notifySellerNewOrder: async (
    sellerEmail: string,
    params: NewOrderEmailParams
  ): Promise<void> => {
    const { subject, html } = newOrderEmail(params)
    await send(sellerEmail, subject, html)
  },

  /**
   * Notify seller when payment is confirmed and they need to deliver.
   * Fired from the Midtrans webhook handler on successful payment.
   */
  notifySellerPaymentConfirmed: async (
    sellerEmail: string,
    params: PaymentConfirmedSellerEmailParams
  ): Promise<void> => {
    const { subject, html } = paymentConfirmedSellerEmail(params)
    await send(sellerEmail, subject, html)
  },

  /**
   * Notify buyer when seller marks the order as delivered.
   * Fired from completeOrder in order.service.ts.
   */
  notifyBuyerOrderDelivered: async (
    buyerEmail: string,
    params: OrderDeliveredBuyerEmailParams
  ): Promise<void> => {
    const { subject, html } = orderDeliveredBuyerEmail(params)
    await send(buyerEmail, subject, html)
  },
}