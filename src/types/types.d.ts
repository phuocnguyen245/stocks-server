import { Types } from 'mongoose'
import { Request } from 'express'

type Status = 'Buy' | 'Sell'
type OrderBy = 'asc' | 'desc'

interface PagePagination<T> {
  page: number
  size: number
  sort?: keyof T
  orderBy?: OrderBy
}

interface User {
  name: string
  username: string
  password: string
  isDeleted: boolean
  // roleId: Types.ObjectId
}

interface Stock {
  _id?: Types.ObjectId
  code: string
  date: string
  volume: number
  orderPrice: number
  sellPrice: number
  marketPrice?: number
  ratio?: number
  status: Status
  userId?: Types.ObjectId
  isDeleted?: boolean
}

interface CurrentStock {
  code: string
  averagePrice: number
  volume: number
  marketPrice: number
  ratio: number
  investedValue?: number
  userId?: Types.ObjectId
}
type PaymentType = 0 | 1
interface Payments {
  name: string
  type: PaymentType
  balance: number
  isDeleted: boolean
  date: string
}

interface Assets {
  availableBalance: number
}

interface RequestWithUser extends Request {
  id: string
}

export type {
  User,
  Stock,
  CurrentStock,
  Payments,
  PaymentsType,
  Assets,
  Status,
  OrderBy,
  PagePagination,
  RequestWithUser
}
