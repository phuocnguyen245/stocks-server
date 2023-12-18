import { FilterQuery, Types } from 'mongoose'
import { Stocks } from '../../models/stock.model.ts'
import type { Stock } from '../../types/types.js'

class StockService {
  static getAllStocks = async (filter?: FilterQuery<Stock>) => {
    const defaultFilter: FilterQuery<Stock> = {
      isDeleted: false
    }

    const data = await Stocks.find(filter ?? defaultFilter).lean()
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
        ...body
      },
      { new: true }
    )

    return data
  }

  static removeStock = async (id: string) => {
    return await Stocks.findByIdAndUpdate(new Types.ObjectId(id), {
      isDeleted: true
    })
  }

  static getCurrentStock = async () => {
    const filter: FilterQuery<Stock> = {
      isDeleted: false,
      status: 'Buy'
    }
    const filteredStocks = this.getAllStocks(filter)
    return await Stocks.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$code',
          purchasePrice: {
            $sum: {
              $multiply: ['$purchasePrice', '$quantity']
            }
          },
          quantity: {
            $sum: '$quantity'
          }
        }
      },
      {
        $project: {
          _id: 0,
          code: '$_id',
          purchasePrice: { $divide: ['$purchasePrice', '$quantity'] },
          quantity: 1
        }
      }
    ])
  }
}

export default StockService
