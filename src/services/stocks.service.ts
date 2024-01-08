import axios from 'axios'
import mongoose, { FilterQuery, Types } from 'mongoose'
import RedisHandler from '../config/redis.ts'
import { Stocks } from '../models/stock.model.ts'
import type { PagePagination, Stock } from '../types/types.js'
import { dateStringToNumber } from '../utils/index.ts'
import CurrentStockService from './currentStock.service.ts'
import { BadRequest } from '../core/error.response.ts'

interface EndOfDayStock {
  date: string
  priceOpen: number
  priceHigh: number
  priceLow: number
  priceClose: number
  adjusted_close: number
  dealVolume: number
}
class StockService {
  static redisHandler = new RedisHandler()

  static getExpiredTime = () => {
    let remainingMilliseconds
    const now = new Date()
    const currentHour = now.getHours() // Get the current hour (0-23)
    if (currentHour < 18) {
      remainingMilliseconds = (18 - currentHour) * 60 * 60 * 1000
    } else {
      remainingMilliseconds = (24 - currentHour + 18) * 60 * 60 * 1000
    }
    return Math.round(remainingMilliseconds / 1000)
  }

  static getEndOfDayPrice = async (code: string) => {
    const endOfDayStocks: EndOfDayStock[] = await this.getEndOfDayStock(code)
    const endOfDayPrice = endOfDayStocks[endOfDayStocks.length - 1].priceClose
    return endOfDayPrice
  }

  static getEndOfDayStock = async (code: string) => {
    const foundStock = await this.redisHandler.get(code)
    if (foundStock) {
      return JSON.parse(foundStock)
    }

    const expiredTime = this.getExpiredTime()

    try {
      if (process.env.FIRE_ANT_KEY) {
        const response = await axios.get(
          `https://restv2.fireant.vn/symbols/${code}/historical-quotes?startDate=2021-01-05&endDate=2024-01-05&offset=0&limit=250`,
          {
            headers: {
              Authorization: `Bearer ${process.env.FIRE_ANT_KEY}`
            }
          }
        )
        await this.redisHandler.save(
          code,
          JSON.stringify((response.data as EndOfDayStock[]).reverse())
        )
        await this.redisHandler.redis.expire(`stocks-${code}`, expiredTime)
        return response.data
      }
    } catch (error) {
      throw new Error(error as string)
    }
  }

  static getAllStocks = async (
    pagination: PagePagination<Stock>,
    extraFilter?: FilterQuery<Stock>
  ) => {
    const { page, size, sort, orderBy } = pagination

    const sortPage = page || 0
    const sortSize = size || 10

    const filter: FilterQuery<Stock> = {
      isDeleted: false,
      ...extraFilter
    }

    const getData = async () =>
      await Stocks.find(filter)
        .sort([
          ['status', 1],
          [`${sort ?? 'createdAt'}`, orderBy ?? 1]
        ])
        .limit(sortSize)
        .skip(sortPage * sortSize)
        .lean()

    const getAllData = async () => await Stocks.count(filter)

    const [data, totalItems] = await Promise.all([getData(), getAllData()])

    return {
      data,
      page: sortPage,
      size: sortSize,
      totalItems
    }
  }

  static getStockById = async (id: string) => {
    return await Stocks.findById(new Types.ObjectId(id)).lean()
  }

  static createStock = async (body: Stock) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const isBuy = body.status === 'Buy'
      const endOfDayPrice = await this.getEndOfDayPrice(body.code)
      let stock: Stock[] | undefined

      const foundCurrentStock = await CurrentStockService.getCurrentStockByCode(body.code)

      if (!isBuy && foundCurrentStock) {
        const newVolume = foundCurrentStock.volume - body.volume

        if (newVolume < 0) {
          throw new BadRequest("This stocks doesn't have enough volume")
        }
      }

      if (isBuy && endOfDayPrice > 0) {
        stock = (await Stocks.create([{ ...body, marketPrice: endOfDayPrice }], { session })) as any
      } else {
        stock = (await Stocks.create([{ ...body }], { session })) as any
      }

      if (stock?.length) {
        await CurrentStockService.convertBodyToCreate(
          stock[0],
          foundCurrentStock,
          endOfDayPrice,
          isBuy,
          session
        )
      }
      return stock
    } catch (error: any) {
      await session.abortTransaction()
      throw new BadRequest(error)
    } finally {
      session.endSession()
    }
  }

  static updateStock = async (id: string, body: Stock) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const isBuy = body.status === 'Buy'

      const oldStock = await this.getStockById(id)
      const { _id, ...rest } = body

      if (oldStock) {
        const endOfDayPrice = await this.getEndOfDayPrice(oldStock.code)
        const newBody = await CurrentStockService.convertBodyToUpdate(
          oldStock,
          rest,
          endOfDayPrice,
          isBuy
        )

        if (newBody) {
          await CurrentStockService.updateCurrentStock(oldStock.code, newBody, session)

          const stock = await Stocks.findByIdAndUpdate(
            new Types.ObjectId(id),
            { ...rest },
            { new: true, session }
          )
          await session?.commitTransaction()
          const convertStock = stock?.toObject()
          return convertStock
        }
      }
      return null
    } catch (error: any) {
      await session.abortTransaction()
      throw new BadRequest(error)
    } finally {
      session.endSession()
    }
  }

  static removeStock = async (id: string, foundStock: Stock) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      await CurrentStockService.updateRemoveStock(foundStock, session)

      const data = await Stocks.findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          isDeleted: true
        },
        { session }
      )

      await session.commitTransaction()
      return data
    } catch (error) {
      return session.abortTransaction()
    } finally {
      session.endSession()
    }
  }

  static getStockStatistics = async (code: string) => {
    const redisCode = `${code}-statistic`
    const foundStockStatistics = await this.redisHandler.get(redisCode)

    if (foundStockStatistics) {
      return JSON.parse(foundStockStatistics)
    }

    const stock = (await this.getEndOfDayStock(code)) as EndOfDayStock[]

    if (!stock || stock.length === 0) {
      return []
    }

    const data: number[][] = stock.map((item) => [
      dateStringToNumber(item.date),
      item.priceOpen,
      item.priceHigh,
      item.priceLow,
      item.priceClose,
      item.dealVolume
    ])

    const expiredTime = this.getExpiredTime()
    const dataString = JSON.stringify(data)

    await this.redisHandler.save(redisCode, dataString)
    await this.redisHandler.redis.expire(`stocks-${redisCode}`, expiredTime)

    return data
  }
}

export default StockService
