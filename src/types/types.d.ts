import { Types } from 'mongoose'

type Status = 'Buy' | 'Sell'

interface User {
  name: string
  username: string
  password: string
}

interface Stock {
  _id?: Types.ObjectId
  code: string
  date: string
  quantity: number
  purchasePrice: number
  currentPrice?: number
  ratio?: number
  actualGain?: number
  status: Status
  userId?: Types.ObjectId
  isDeleted?: boolean
}

export type { User, Stock, Status }
