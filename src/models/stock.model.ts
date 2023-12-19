import mongoose from 'mongoose'
import type { Stock } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'Stock',
  COLLECTION: 'Stocks'
}

const StockSchema = new Schema<Stock>(
  {
    code: String,
    date: String,
    quantity: Number,
    purchasePrice: Number,
    currentPrice: Number,
    ratio: Number,
    actualGain: Number,
    status: {
      type: String,
      enum: ['Buy', 'Sell'],
      default: 'Buy',
      required: true
    },
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    // },
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

export const Stocks = mongoose.model(NAME.DOCUMENT, StockSchema)

console.log((30 * 200 + 22.5 * 300) / 500)
console.log((30 + 22.5 + 22.5) / 3)
