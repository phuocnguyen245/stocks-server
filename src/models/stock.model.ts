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
    volume: Number,
    orderPrice: Number,
    marketPrice: Number,
    sellPrice: Number,
    status: {
      type: String,
      enum: ['Buy', 'Sell'],
      default: 'Buy',
      required: true
    },
    ratio: {
      type: Number,
      default: 0
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
