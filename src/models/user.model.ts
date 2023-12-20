import mongoose from 'mongoose'
import type { User } from '../types/types.js'
const { Schema } = mongoose

const NAME = {
  DOCUMENT: 'User',
  COLLECTION: 'Users'
}

const UserSchema = new Schema<User>(
  {
    name: String,
    username: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: NAME.COLLECTION
  }
)

export const Users = mongoose.model(NAME.DOCUMENT, UserSchema)
