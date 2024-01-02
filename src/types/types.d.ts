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
  sellPrice: number
  currentPrice?: number
  ratio?: number
  status: Status
  userId?: Types.ObjectId
  isDeleted?: boolean
}

interface CurrentStock {
  code: string
  average: number
  quantity: number
  currentPrice: number
  ratio: number
  actualGain?: number
  userId?: Types.ObjectId
}

export type { User, Stock, CurrentStock, Status }
