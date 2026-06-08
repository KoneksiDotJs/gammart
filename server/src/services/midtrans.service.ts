import crypto from 'crypto'
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

export interface MidtransNotification {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
  transaction_status: string
  fraud_status?: string
  transaction_id: string
  [key: string]: string | undefined
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
   * Verify the signature of an incoming Midtrans webhook notification.
   *
   * Midtrans signs every notification with:
   *   SHA512( order_id + status_code + gross_amount + server_key )
   *
   * We verify this before trusting any status update.
   */
  verifySignature: (notification: MidtransNotification): boolean => {
    const { order_id, status_code, gross_amount, signature_key } = notification
    const expected = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${env.midtrans.serverKey}`)
      .digest('hex')
    return expected === signature_key
  },

  /**
   * Fetch the latest transaction status from Midtrans using the order_id.
   * More reliable than trusting the notification body alone.
   */
  getTransactionStatus: async (orderId: string) => {
    return snap.transaction.status(orderId)
  },
}