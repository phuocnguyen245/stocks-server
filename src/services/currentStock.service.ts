import mongoose, { Types } from 'mongoose'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { CurrentStocks } from '../models/currentStock.model.ts'
import { Stock, type CurrentStock, PagePagination } from '../types/types.js'
import { convertToDecimal, countDays } from '../utils/index.ts'
import StockService from './stocks.service.ts'
import RedisHandler from '../config/redis.ts'
import { Stocks } from '../models/stock.model.ts'

class CurrentStockService {
  static redisHandler = new RedisHandler()

  static getCurrentStocks = async (pagination: PagePagination<CurrentStock>) => {
    const { page, size, sortBy, sortDirection, userId } = pagination
    const redisCode = `update-countdown-${userId}`
    const sortPage = page || 0
    const sortSize = size || 10

    const isHaveCurrentStock = await this.redisHandler.get(redisCode)

    if (!isHaveCurrentStock) {
      const currentStock = (await this.redisHandler.get(`current-${userId}`)) as string[]

      if (currentStock && currentStock?.length) {
        const stockPromises = currentStock.map(async (stock: string) => {
          const price = await StockService.getEndOfDayPrice(stock)
          return { [stock]: price }
        })
        const resolvedStockPromises = await Promise.all(stockPromises)
        const data = resolvedStockPromises.reduce((acc, cur) => ({ ...acc, ...cur }), {})

        const updateStockPromises = currentStock.map(async (stock: string) => {
          return await this.updateCurrentStockByDay(stock, data[stock], userId)
        })
        await Promise.all(updateStockPromises)
      }
      await this.redisHandler.save(redisCode, true)
    }

    const order = sortDirection || 'desc'

    const [data, totalItems] = await Promise.all([
      CurrentStocks.aggregate([
        {
          $match: { userId: new Types.ObjectId(userId) }
        },
        {
          $lookup: {
            localField: 'code',
            from: 'Stocks',
            foreignField: 'code',
            as: 'stocks',
            pipeline: [
              {
                $match: {
                  userId: new Types.ObjectId(userId),
                  status: 'Buy',
                  isDeleted: false
                }
              }
            ]
          }
        },
        {
          $sort: {
            [`${sortBy || 'averagePrice'}`]: order === 'asc' ? 1 : -1
          }
        },
        {
          $skip: sortPage * sortSize
        },
        {
          $limit: sortSize
        }
      ]),
      CurrentStocks.count({ userId: new Types.ObjectId(userId) })
    ])

    let resultData = data

    if (!sortBy) {
      resultData = data.sort((a, b) => b.volume * b.averagePrice - a.volume * a.averagePrice)
    }

    const formatResult = resultData.map((item: Stock) => {
      const stocks = item.stocks?.filter((stock: Stock) => {
        return countDays(stock.date) < 2.5
      })
      const unavailableVol = stocks?.reduce((acc: number, stock: Stock) => acc + stock.volume, 0)
      return {
        ...item,
        unavailableVol,
        availableVol: item.volume - (unavailableVol ?? 0),
        stocks
      }
    })

    const codes = data.map((item) => item.code)
    await this.redisHandler.save(`current-${userId}`, codes)

    const expiredTime = StockService.getExpiredTime()
    await this.redisHandler.setExpired(redisCode, expiredTime)

    return {
      data: formatResult,
      page: sortPage,
      size: sortSize,
      totalItems
    }
  }

  static getCurrentStockByCode = async (code: string, userId: string) => {
    const stock = await CurrentStocks.findOne({ code, userId: new Types.ObjectId(userId) }).lean()
    return stock
  }

  static createCurrentStock = async (
    body: CurrentStock,
    userId: string,
    session?: mongoose.mongo.ClientSession
  ) => {
    const stock = await CurrentStocks.create([{ ...body, userId: new Types.ObjectId(userId) }], {
      session: session || undefined
    })
    return stock[0].toObject()
  }

  static updateCurrentStock = async (
    code: string,
    body: CurrentStock,
    userId: string,
    session?: mongoose.mongo.ClientSession
  ) => {
    const updatedCurrentStock = await CurrentStocks.findOneAndUpdate(
      { code, userId: new Types.ObjectId(userId) },
      { ...body },
      { isNew: true, session: session || undefined }
    )
    return updatedCurrentStock?.toObject()
  }

  static removeCurrentStock = async (
    code: string,
    userId: string,
    session?: mongoose.mongo.ClientSession
  ) => {
    return await CurrentStocks.findOneAndDelete(
      { code, userId: new Types.ObjectId(userId) },
      { session: session || undefined }
    )
  }

  static convertBodyToCreate = async (
    stock: Stock,
    foundCurrentStock: CurrentStock | null,
    endOfDayPrice: number,
    isBuy: boolean,
    userId: string,
    session?: mongoose.mongo.ClientSession
  ) => {
    const { code, orderPrice, volume, sector } = stock

    let newVolume = 0
    let newAveragePrice = 0

    if (foundCurrentStock) {
      if (isBuy) {
        newVolume = foundCurrentStock.volume + volume

        newAveragePrice = convertToDecimal(
          (foundCurrentStock.averagePrice * foundCurrentStock.volume + orderPrice * volume) /
            newVolume
        )
      } else {
        newVolume = foundCurrentStock.volume - volume
        newAveragePrice = convertToDecimal(foundCurrentStock.averagePrice)

        if (newVolume < 0) {
          throw new BadRequest("This stocks doesn't have enough volume")
        }

        if (newVolume === 0) {
          this.removeCurrentStock(code, userId, session)
        }
      }
      const ratio = (foundCurrentStock.marketPrice - newAveragePrice) / newAveragePrice

      const investedValue = convertToDecimal(
        (foundCurrentStock.marketPrice - newAveragePrice) * newVolume,
        3
      )
      const currentStock: CurrentStock = {
        code,
        averagePrice: newAveragePrice,
        volume: newVolume,
        ratio,
        marketPrice: foundCurrentStock.marketPrice,
        sector: foundCurrentStock.sector,
        investedValue
      }
      const updatedStock = await CurrentStockService.updateCurrentStock(
        code,
        currentStock,
        userId,
        session
      )
      await session?.commitTransaction()
      return updatedStock
    }

    if (!isBuy) {
      await session?.abortTransaction()
      throw new BadRequest('Can not')
    }

    const currentStock: CurrentStock = {
      code,
      averagePrice: convertToDecimal(orderPrice),
      marketPrice: endOfDayPrice,
      volume,
      ratio: (endOfDayPrice - orderPrice) / orderPrice,
      investedValue: convertToDecimal((endOfDayPrice - orderPrice) * volume, 3),
      sector
    }

    const createdStock = await CurrentStockService.createCurrentStock(currentStock, userId, session)
    await session?.commitTransaction()
    return createdStock
  }

  static convertBodyToUpdate = async (
    oldStock: Stock,
    body: Stock,
    endOfDayPrice: number,
    isBuy: boolean,
    userId: string
  ): Promise<CurrentStock | null> => {
    const foundCurrentStock = await this.getCurrentStockByCode(oldStock.code, userId)

    if (foundCurrentStock) {
      const { volume, orderPrice } = body
      let newVolume = oldStock.volume
      let newAveragePrice = 0
      if (isBuy) {
        if (volume && volume > 0) {
          newVolume = foundCurrentStock.volume - oldStock.volume + volume
        }

        newAveragePrice =
          (foundCurrentStock.averagePrice * foundCurrentStock.volume -
            oldStock.orderPrice * oldStock.volume +
            volume * orderPrice) /
          newVolume

        const currentStock: CurrentStock = {
          ...body,
          volume: newVolume,
          averagePrice: convertToDecimal(newAveragePrice),
          marketPrice: foundCurrentStock.marketPrice,
          investedValue: convertToDecimal(
            (foundCurrentStock.marketPrice - newAveragePrice) * newVolume,
            3
          ),
          ratio: (foundCurrentStock.marketPrice - newAveragePrice) / newAveragePrice
        }
        return currentStock
      }
      if (volume >= 0) {
        newVolume = foundCurrentStock.volume + oldStock.volume - volume
      }
      newVolume < 0 && new BadRequest('Volume must be greater than 0')
      const currentStock: CurrentStock = {
        ...body,
        volume: newVolume,
        averagePrice: convertToDecimal(foundCurrentStock.averagePrice),
        marketPrice: endOfDayPrice,
        investedValue: convertToDecimal(
          (endOfDayPrice - foundCurrentStock.averagePrice) * newVolume,
          3
        ),
        ratio: (endOfDayPrice - foundCurrentStock.averagePrice) / foundCurrentStock.averagePrice
      }
      return currentStock
    }

    return null
  }

  static updateRemoveStock = async (
    stock: Stock,
    userId: string,
    session: mongoose.mongo.ClientSession
  ) => {
    const isBuy = stock.status === 'Buy'
    const foundCurrentStock = await this.getCurrentStockByCode(stock.code, userId)

    const marketPrice = await StockService.getEndOfDayPrice(stock.code)
    if (!foundCurrentStock) {
      if (!isBuy) {
        return await Stocks.findByIdAndUpdate(
          new Types.ObjectId(stock._id),
          {
            isDeleted: true
          },
          { session }
        )
      }
      const marketPrice = await StockService.getEndOfDayPrice(stock.code)
      return await this.createCurrentStock(
        {
          averagePrice: stock.orderPrice,
          sector: stock.sector,
          code: stock.code,
          marketPrice,
          volume: stock.volume,
          ratio: (marketPrice - stock.orderPrice) / stock.orderPrice,
          investedValue: convertToDecimal((marketPrice - stock.orderPrice) * stock.volume)
        },
        userId,
        session
      )
    }
    if (!isBuy) {
      const newVolume = stock.volume + foundCurrentStock.volume
      const averagePrice =
        (foundCurrentStock.averagePrice * foundCurrentStock.volume +
          stock.volume * stock.orderPrice) /
        newVolume
      return await this.updateCurrentStock(
        stock.code,
        {
          volume: newVolume,
          sector: foundCurrentStock.sector,
          code: stock.code,
          averagePrice,
          marketPrice: foundCurrentStock.marketPrice,
          ratio: foundCurrentStock.ratio,
          investedValue: convertToDecimal((marketPrice - averagePrice) * newVolume)
        },
        userId,
        session
      )
    }
    const newVolume = foundCurrentStock.volume - stock.volume

    if (newVolume < 0) {
      throw Error(`This stock is out of range`)
    }

    if (newVolume === 0) {
      return this.removeCurrentStock(stock.code, userId, session)
    }

    const averagePrice = convertToDecimal(
      (foundCurrentStock.averagePrice * foundCurrentStock.volume -
        stock.volume * stock.orderPrice) /
        newVolume
    )
    const ratio = (foundCurrentStock.marketPrice - averagePrice) / averagePrice
    const investedValue = convertToDecimal(
      (foundCurrentStock.marketPrice - averagePrice) * newVolume
    )

    return await this.updateCurrentStock(
      stock.code,
      {
        code: stock.code,
        sector: stock.sector,
        averagePrice,
        volume: newVolume,
        marketPrice: foundCurrentStock.marketPrice,
        ratio,
        investedValue
      },
      userId,
      session
    )
  }

  static updateCurrentStockByDay = async (code: string, marketPrice: number, userId: string) => {
    const foundCurrentStock = await this.getCurrentStockByCode(code, userId)

    if (!foundCurrentStock) {
      throw new NotFound('Stock not found')
    }
    const newBody: CurrentStock = {
      code,
      marketPrice,
      averagePrice: foundCurrentStock.averagePrice,
      ratio: (marketPrice - foundCurrentStock.averagePrice) / foundCurrentStock.averagePrice,
      volume: foundCurrentStock.volume,
      investedValue: convertToDecimal(
        (marketPrice - foundCurrentStock.averagePrice) * foundCurrentStock.volume
      ),
      sector: foundCurrentStock.sector
    }
    const updatedStock = await this.updateCurrentStock(code, newBody, userId)
    return updatedStock
  }
}

export default CurrentStockService
