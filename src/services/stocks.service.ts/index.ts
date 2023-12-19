import { FilterQuery, Types } from 'mongoose'
import { Stocks } from '../../models/stock.model.ts'
import type { Stock } from '../../types/types.js'

interface PagePagination {
  page: number
  size: number
  sort?: keyof Stock
  orderBy?: 'asc' | 'desc'
}

class StockService {
  static getAllStocks = async (pagination: PagePagination, filter?: FilterQuery<Stock>) => {
    const { page = 1, size = 10, sort = 'updatedAt', orderBy = 'asc' } = pagination

    const defaultFilter: FilterQuery<Stock> = {
      isDeleted: false
    }

    const data = await Stocks.find(filter ?? defaultFilter)
      .limit(page)
      .skip(page * size)
      .sort({
        [`${sort}`]: orderBy
      })
      .lean()
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
    return await Stocks.aggregate([
      {
        $match: {
          isDeleted: false,
          status: 'Buy'
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
          },
          currentPrice: { $first: '$currentPrice' }
        }
      },
      {
        $addFields: {
          ratio: {
            $divide: [
              { $subtract: ['$currentPrice', { $divide: ['$purchasePrice', '$quantity'] }] },
              { $divide: ['$purchasePrice', '$quantity'] }
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          code: '$_id',
          purchasePrice: { $divide: ['$purchasePrice', '$quantity'] },
          quantity: 1,
          currentPrice: 1,
          ratio: { $multiply: ['$ratio', 100] },
          actualGain: { $multiply: ['$quantity', '$currentPrice'] }
        }
      }
    ])
  }
}

export default StockService
