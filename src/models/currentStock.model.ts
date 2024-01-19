import mongoose, { Types } from 'mongoose'
import type { CurrentStock } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'CurrentStock',
  COLLECTION: 'CurrentStocks'
}

const CurrentStockSchema = new Schema<CurrentStock>(
  {
    code: {
      type: String,
      required: true
    },
    averagePrice: {
      type: Number,
      required: true
    },
    ratio: {
      type: Number,
      required: true
    },
    marketPrice: {
      type: Number,
      required: true
    },
    volume: {
      type: Number,
      required: true
    },
    userId: Types.ObjectId,
    investedValue: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
    collection: NAME.COLLECTION
  }
)

export const CurrentStocks = mongoose.model(NAME.DOCUMENT, CurrentStockSchema)
