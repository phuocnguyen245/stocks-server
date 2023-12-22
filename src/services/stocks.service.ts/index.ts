import { FilterQuery, Types } from 'mongoose'
import { Stocks } from '../../models/stock.model.ts'
import type { Stock } from '../../types/types.js'
import axios from 'axios'
import RedisHandler from '../../config/redis.ts'
import { dateStringToNumber } from '../../utils/index.ts'
import { BadRequest } from '../../core/error.response.ts'

interface PagePagination {
  page: number
  size: number
  sort?: keyof Stock
  orderBy?: 'asc' | 'desc'
}
interface EndOfDayStock {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjusted_close: number
  volume: number
}
class StockService {
  static redisHandler = new RedisHandler()

  static getEndOfDayStock = async (code: string) => {
    const foundCode = await this.redisHandler.get(code)
    if (foundCode) {
      return JSON.parse(foundCode)
    }
    let remainingMilliseconds
    const now = new Date()
    const currentHour = now.getHours() // Get the current hour (0-23)
    if (currentHour < 18) {
      remainingMilliseconds = (18 - currentHour) * 60 * 60 * 1000
    } else {
      remainingMilliseconds = (24 - currentHour + 18) * 60 * 60 * 1000
    }

    try {
      const response = await axios.get(
        `https://eodhd.com/api/eod/${code}.VN?api_token=6581c09e24c079.86508753&fmt=json`
      )

      await this.redisHandler.save(code, JSON.stringify(response.data))
      await this.redisHandler.redis.expire(
        `stocks-${code}`,
        Math.round(remainingMilliseconds / 1000)
      )
      return response.data
    } catch (error) {
      throw new Error(error as string)
    }
  }

  static getAllStocks = async (pagination: PagePagination, filter?: FilterQuery<Stock>) => {
    const { page = 1, size = 10, sort = 'createAt', orderBy = 'asc' } = pagination

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
    const response = await this.getEndOfDayStock(body.code)
    if (response.length > 0) {
      const data = (
        await Stocks.create({ ...body, currentPrice: response[response.length - 1].close / 1000 })
      ).toObject()
      return data
    }
    throw new BadRequest('Error creating stock')
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
    const currentStocks = await Stocks.aggregate([
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
    const stocks: string[] = []
    currentStocks.forEach((item) => {
      stocks.push(item.code)
    })
    await this.redisHandler.save('user', JSON.stringify(stocks))
    return currentStocks
  }

  static getStockStatistics = async (code: string) => {
    const stock = (await this.getEndOfDayStock(code)) as EndOfDayStock[]
    if (stock) {
      const data = stock.map((item) => [
        dateStringToNumber(item.date),
        item.open,
        item.high,
        item.low,
        item.close,
        item.volume
      ])
      return data
    }
    return []
  }
}

export default StockService
