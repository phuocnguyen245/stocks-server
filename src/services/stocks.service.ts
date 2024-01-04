import axios from 'axios'
import { FilterQuery, Types } from 'mongoose'
import RedisHandler from '../config/redis.ts'
import { Stocks } from '../models/stock.model.ts'
import type { PagePagination, Stock } from '../types/types.js'
import { dateStringToNumber } from '../utils/index.ts'
import CurrentStockService from './currentStock.service.ts'
import { BadRequest } from '../core/error.response.ts'
import { log } from 'console'

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
    const endOfDayStocks = await this.getEndOfDayStock(code)
    const endOfDayPrice = endOfDayStocks[endOfDayStocks.length - 1].close / 1000
    return endOfDayPrice
  }

  static getEndOfDayStock = async (code: string) => {
    const foundStock = await this.redisHandler.get(code)
    if (foundStock) {
      return JSON.parse(foundStock)
    }

    const expiredTime = this.getExpiredTime()

    try {
      const response = await axios.get(
        `https://eodhd.com/api/eod/${code}.VN?api_token=6581c09e24c079.86508753&fmt=json`
      )

      await this.redisHandler.save(code, JSON.stringify(response.data))
      await this.redisHandler.redis.expire(`stocks-${code}`, expiredTime)

      return response.data
    } catch (error) {
      throw new Error(error as string)
    }
  }

  static getAllStocks = async (
    pagination: PagePagination<Stock>,
    extraFilter?: FilterQuery<Stock>
  ) => {
    const { page, size, sort, orderBy } = pagination

    const filter: FilterQuery<Stock> = {
      isDeleted: false,
      ...extraFilter
    }

    const data = await Stocks.find(filter)
      .limit(size ?? 10)
      .skip(((page ?? 1) - 1) * (size ?? 10))
      .sort({
        [`${sort ?? 'createAt'}`]: orderBy ?? 'asc'
      })
      .lean()
    return data
  }

  static getStockById = async (id: string) => {
    return await Stocks.findById(new Types.ObjectId(id)).lean()
  }

  static createStock = async (body: Stock) => {
    const isBuy = body.status === 'Buy'
    const endOfDayPrice = await this.getEndOfDayPrice(body.code)
    let stock: Stock | undefined

    const foundCurrentStock = await CurrentStockService.getCurrentStockByCode(body.code)

    if (!isBuy && foundCurrentStock) {
      const newVolume = foundCurrentStock.volume - body.volume

      if (newVolume < 0) {
        throw new BadRequest("This stocks doesn't have enough volume")
      }
    }

    if (isBuy && endOfDayPrice > 0) {
      stock = (await Stocks.create({ ...body, marketPrice: endOfDayPrice })).toObject()
    } else {
      stock = (await Stocks.create({ ...body })).toObject()
    }

    await CurrentStockService.convertBodyToCreate(stock, foundCurrentStock, endOfDayPrice, isBuy)

    return stock
  }

  static updateStock = async (id: string, body: Stock) => {
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
        await CurrentStockService.updateCurrentStock(oldStock.code, newBody)

        const stock = await Stocks.findByIdAndUpdate(
          new Types.ObjectId(id),
          { ...rest },
          { new: true }
        )
        const convertStock = stock?.toObject()
        return convertStock
      }
    }
    return null
  }

  static removeStock = async (id: string) => {
    return await Stocks.findByIdAndUpdate(new Types.ObjectId(id), {
      isDeleted: true
    })
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
      item.open,
      item.high,
      item.low,
      item.close,
      item.volume
    ])

    const expiredTime = this.getExpiredTime()
    const dataString = JSON.stringify(data)

    await this.redisHandler.save(redisCode, dataString)
    await this.redisHandler.redis.expire(`stocks-${redisCode}`, expiredTime)

    return data
  }
}

export default StockService
