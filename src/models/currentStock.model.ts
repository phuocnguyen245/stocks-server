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
      unique: true,
      required: true
    },
    average: {
      type: Number,
      required: true
    },
    ratio: {
      type: Number,
      required: true
    },
    currentPrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    // userId: Types.ObjectId,
    actualGain: {
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
