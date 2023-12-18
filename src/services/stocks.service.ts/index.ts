import { Types } from 'mongoose'
import { Stocks } from '../../models/stock.model.ts'
import type { Stock } from '../../types/types.js'

class StockService {
  static getAllStocks = async () => {
    const data = await Stocks.find({ isDeleted: false }).lean()
    return data
  }

  static getStockById = async (id: string) => {
    return await Stocks.findById(new Types.ObjectId(id)).lean()
  }

  static createStock = async (body: Stock) => {
    const data = (await Stocks.create(body)).toObject()
    return data
  }

  static updateStock = async (id: string, body: Stock) => {
    const data = await Stocks.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        ...body,
      },
      { new: true }
    )

    return data
  }

  static removeStock = async (id: string) => {
    return await Stocks.findByIdAndUpdate(new Types.ObjectId(id), {
      isDeleted: true,
    })
  }
}

export default StockService
