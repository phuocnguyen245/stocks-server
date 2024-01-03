import mongoose from 'mongoose'
import type { Payments as PaymentsType } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'Payment',
  COLLECTION: 'Payments'
}

// type 0 = top up, type 1 = withdraw, type 2 = fee
const PaymentSchema = new Schema<PaymentsType>(
  {
    name: String,
    balance: Number,
    type: {
      type: Number,
      enum: [0, 1, 2],
      default: 0
    },
    isDelete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: NAME.COLLECTION
  }
)

export const Payments = mongoose.model(NAME.DOCUMENT, PaymentSchema)
