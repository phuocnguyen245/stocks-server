import mongoose, { Types } from 'mongoose'
import type { WatchList as WatchListType } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'WatchList',
  COLLECTION: 'WatchList'
}

const WatchListSchema = new Schema<WatchListType>(
  {
    userId: Schema.Types.ObjectId,
    attributes: Schema.Types.Array
  },
  {
    timestamps: true,
    collection: NAME.COLLECTION
  }
)

export const WatchList = mongoose.model(NAME.DOCUMENT, WatchListSchema)
