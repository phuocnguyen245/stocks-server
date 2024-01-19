import mongoose, { Types } from 'mongoose'
import type { Assets as AssetsType } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'Assets',
  COLLECTION: 'Assets'
}

const AssetsSchema = new Schema<AssetsType>(
  {
    availableBalance: Number,
    userId: Types.ObjectId
  },
  {
    timestamps: true,
    collection: NAME.COLLECTION
  }
)

export const Assets = mongoose.model(NAME.DOCUMENT, AssetsSchema)
