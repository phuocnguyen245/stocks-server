import { Types } from 'mongoose'
import { Request } from 'express'

type Status = 'Buy' | 'Sell'
type OrderBy = 'asc' | 'desc'

interface PagePagination<T> {
  page: number
  size: number
  sort?: keyof T
  orderBy?: OrderBy
  userId: string
  from?: string
  to?: string
}

interface User {
  name: string
  username: string
  password: string
  isDeleted: boolean
  email: string
  // roleId: Types.ObjectId
}
interface Target {
  name: string
  price: number
  volume: number
}
interface Stock {
  _id?: Types.ObjectId
  code: string
  date: string
  volume: number
  orderPrice: number
  sellPrice: number
  marketPrice?: number
  take: Array<Target>
  stop: Array<Target>
  ratio?: number
  status: Status
  userId?: Types.ObjectId
  isDeleted?: boolean
}

interface StockWithUserId extends Stock {
  userId: Types.ObjectId
}

interface CurrentStock {
  code: string
  averagePrice: number
  volume: number
  marketPrice: number
  ratio: number
  investedValue?: number
  userId?: Types.ObjectId
  stocks?: any[]
}
type PaymentType = 0 | 1
interface Payments {
  name: string
  type: PaymentType
  balance: number
  isDeleted: boolean
  date: string
  userId: string
}

interface Assets {
  availableBalance: number
  userId: string
}

interface RequestWithUser extends Request {
  id: string
}

interface RecommendedFilter {
  macd: number[]
  rsi: number[]
  stoch: number[]
  mfi: number[]
  stochRSI: number[]
}

interface WatchListItem {
  name: string
  order: number
  items: {
    symbols: string[]
    stock: {
      companyName: string
      code: string
      close: number
      change: number
      changePercent: number
    }
  }
}
interface WatchList {
  userId: Types.ObjectId
  attributes: WatchListItem[]
}

export type {
  User,
  Stock,
  CurrentStock,
  Payments,
  PaymentType,
  Assets,
  Status,
  OrderBy,
  PagePagination,
  RequestWithUser,
  StockWithUserId,
  Target,
  RecommendedFilter,
  WatchList
}
