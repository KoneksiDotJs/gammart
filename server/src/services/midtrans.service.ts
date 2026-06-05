import { env } from '../config/env'

// Note: midtrans-client doesn't have great TS types, so we type what we need
const midtransClient = require('midtrans-client')

const snap = new midtransClient.Snap({
  isProduction: env.midtrans.isProduction,
  serverKey: env.midtrans.serverKey,
  clientKey: env.midtrans.clientKey,
})

export interface MidtransTransactionDetails {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  itemName: string
}

export interface MidtransSnapResult {
  token: string
  redirectUrl: string
}

export const midtransService = {
  /**
   * Create a Midtrans Snap payment token.
   * The frontend uses this token to open the Snap payment modal.
   */
  createSnapTransaction: async (
    details: MidtransTransactionDetails
  ): Promise<MidtransSnapResult> => {
    const parameter = {
      transaction_details: {
        order_id: details.orderId,
        gross_amount: Math.round(details.amount), // IDR, must be integer
      },
      customer_details: {
        first_name: details.customerName,
        email: details.customerEmail,
      },
      item_details: [
        {
          id: details.orderId,
          price: Math.round(details.amount),
          quantity: 1,
          name: details.itemName.substring(0, 50), // Midtrans max 50 chars
        },
      ],
    }

    const transaction = await snap.createTransaction(parameter)

    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    }
  },

  /**
   * Verify a webhook notification from Midtrans.
   * Midtrans sends POST requests to your webhook URL when payment status changes.
   */
  verifyNotification: async (notification: Record<string, string>) => {
    const statusResponse = await snap.transaction.notification(notification)
    return statusResponse
  },
}