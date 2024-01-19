import mongoose, { Types } from 'mongoose'
import type { Payments as PaymentsType } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'Payment',
  COLLECTION: 'Payments'
}

// type 0 = top up, type 1 = withdraw
const PaymentSchema = new Schema<PaymentsType>(
  {
    userId: Types.ObjectId,
    name: String,
    balance: Number,
    type: {
      type: Number,
      enum: [0, 1],
      default: 0
    },
    date: {
      type: String,
      required: true
    },
    isDeleted: {
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
