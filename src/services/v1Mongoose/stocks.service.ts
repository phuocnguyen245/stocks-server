import axios from 'axios'
import moment from 'moment'
import mongoose, { FilterQuery, Types } from 'mongoose'
import cron from 'node-cron'
import RedisHandler from '../../config/redis.ts'
import { BadRequest } from '../../core/error.response.ts'
import type { PagePagination, RecommendedFilter, Stock } from '../../types/types.js'
import { countDays, dateStringToNumber } from '../../utils/index.ts'
import AssetsService from './assets.service.ts'
import ThirdPartyService from './thirdParty.service.ts'
import { filterBoardStocks, findDuplicateStocks } from '../utils/index.ts'
import Indicator from '../utils/indicator.ts'
import CurrentStockService from './currentStock.service.ts'

import { Stocks } from '../../models/stock.model.ts'
import { CurrentStocks } from '../../models/currentStock.model.ts'

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

  static getBalance = async (userId: string) => {
    const assets = await AssetsService.getAsset(userId)
    return assets.cash
  }

  static checkBalanceBuy = async (balance: number, userId: string) => {
    const totalBalance = await this.getBalance(userId)
    if (totalBalance >= balance) {
      return true
    }
    return false
  }

  static checkBalanceUpdate = async (oldBalance: number, balance: number, userId: string) => {
    const totalBalance = await this.getBalance(userId)
    return totalBalance + oldBalance >= balance
  }

  static getExpiredTime = (hour = 15) => {
    let remainingMilliseconds
    const now = moment().utcOffset(420)
    const currentHour = now.hours()
    const minutes = now.minutes()
    const seconds = now.seconds()

    if (currentHour < hour) {
      remainingMilliseconds =
        (hour - currentHour) * 60 * 60 * 1000 - (minutes * 58 * 1000 + seconds * 1000)
    } else {
      remainingMilliseconds =
        (24 - currentHour + hour) * 60 * 60 * 1000 - (minutes * 58 * 1000 + seconds * 1000)
    }
    return Math.round(remainingMilliseconds / 1000)
  }

  static getFireAntWatchList = async () => {
    const redisCode = 'watch-lists'
    const foundWatchList = await this.redisHandler.get(redisCode)
    if (foundWatchList) {
      return foundWatchList
    }
    const expiredTime = this.getExpiredTime()
    try {
      const FIRE_ANT_KEY = process.env.FIRE_ANT_KEY
      if (FIRE_ANT_KEY) {
        const response = await axios.get(`https://restv2.fireant.vn/me/watchlists`, {
          headers: {
            Authorization: `Bearer ${FIRE_ANT_KEY}`
          }
        })
        await this.redisHandler.save(redisCode, (response.data as EndOfDayStock[])?.reverse())
        await this.redisHandler.setExpired(redisCode, expiredTime)
        return response.data
      }
    } catch (error) {
      throw new Error(error as string)
    }
  }

  static getWatchList = async () => {
    const redisCode = 'watch-lists'
    const foundWatchList = await this.redisHandler.get(redisCode)
    if (foundWatchList) {
      return foundWatchList
    }

    const [boardList, faWatchList] = await Promise.all([
      ThirdPartyService.getBoard(),
      this.getFireAntWatchList()
    ])
    const stocksInList = faWatchList.flatMap((item: any) => item?.symbols) || []
    const sortedList = stocksInList.sort((a: string, b: string) => (a > b ? 1 : -1))
    const arr = findDuplicateStocks(boardList, sortedList)

    const watchList = faWatchList.map((item: any) => {
      const data: any = []
      item.symbols.forEach((code: string) => {
        arr.forEach((arrItem: any) => {
          if (arrItem.symbol === code) {
            data.push(arrItem)
          }
        })
      })
      return {
        ...item,
        stocks: data
      }
    })
    const expiredTime = this.getExpiredTime()
    await this.redisHandler.save(redisCode, watchList)
    await this.redisHandler.setExpired(redisCode, expiredTime)
    return watchList
  }

  static getEndOfDayPrice = async (code: string) => {
    const endOfDayStocks: EndOfDayStock[] = await this.getEndOfDayStock(code)
    const endOfDayPrice = endOfDayStocks[endOfDayStocks.length - 1].priceClose
    return endOfDayPrice
  }

  static getEndOfDayStock = async (code: string) => {
    const redisCode = `fa-${code}`
    const foundStock = await this.redisHandler.get(redisCode)
    const today = moment().utcOffset(420).format('YYYY-MM-DD')
    if (foundStock) {
      return foundStock
    }

    const expiredTime = this.getExpiredTime()
    try {
      const FIRE_ANT_KEY = process.env.FIRE_ANT_KEY

      if (FIRE_ANT_KEY) {
        const response = await ThirdPartyService.getStockHistorical(code, today)
        if (response) {
          await this.redisHandler.save(redisCode, response?.reverse() as EndOfDayStock[])
          await this.redisHandler.setExpired(redisCode, expiredTime)
          return response
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  static getAllStocks = async (
    pagination: PagePagination<Stock>,
    extraFilter?: FilterQuery<Stock>
  ) => {
    const { page, size, sortDirection, sortBy, userId } = pagination

    const sortPage = page || 0
    const sortSize = size || 10
    const order = sortDirection || 'desc'

    const filter: FilterQuery<Stock> = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
      ...(extraFilter?.status && { status: extraFilter?.status }),
      code: { $regex: extraFilter?.search || '', $options: 'i' },
      updatedAt: {
        $gte: extraFilter?.from ?? '2022-12-31T17:00:00.000Z',
        $lte: extraFilter?.to ?? '2027-12-31T17:00:00.000Z'
      }
    }

    const getData = async () =>
      await Stocks.find(filter)
        .sort([[`${sortBy || 'createdAt'}`, order]])
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

  static createStock = async (body: Stock, userId: string) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const isBuy = body.status === 'Buy'
      const endOfDayPrice = await this.getEndOfDayPrice(body.code)
      let stock: Stock[] | undefined

      const foundCurrentStock = await CurrentStockService.getCurrentStockByCode(body.code, userId)

      if (!isBuy && foundCurrentStock) {
        const newVolume = foundCurrentStock.volume - body.volume

        if (newVolume < 0) {
          throw new BadRequest("This stocks doesn't have enough volume")
        }
      }

      if (isBuy && endOfDayPrice > 0) {
        // if (await this.checkBalanceBuy(body.orderPrice * body.volume, userId)) {
        stock = (await Stocks.create(
          [
            {
              ...body,
              userId: new Types.ObjectId(userId),
              marketPrice: endOfDayPrice,
              averagePrice: foundCurrentStock?.averagePrice || 0
            }
          ],
          {
            session
          }
        )) as any
        // } else {
        //   throw new BadRequest("You don't have enough money to do")
        // }
      } else {
        stock = (await Stocks.create(
          [
            {
              ...body,
              orderPrice: foundCurrentStock?.averagePrice,
              averagePrice: foundCurrentStock?.averagePrice || 0,
              userId: new Types.ObjectId(userId)
            }
          ],
          {
            session
          }
        )) as any
      }

      if (stock?.length) {
        await CurrentStockService.convertBodyToCreate(
          stock[0],
          foundCurrentStock,
          endOfDayPrice,
          isBuy,
          userId,
          session
        )
      }
      return stock
    } catch (error: any) {
      await session.abortTransaction()
      await session.endSession()
      throw new BadRequest(error.message)
    }
  }

  static updateStock = async (id: string, body: Stock, userId: string) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const isBuy = body.status === 'Buy'

      const oldStock = await this.getStockById(id)

      const { _id, ...rest } = body

      if (oldStock) {
        const oldBalance = (oldStock.orderPrice || oldStock.sellPrice) * oldStock.volume
        const newBalance = (body.orderPrice || body.sellPrice) * body.volume

        if (await this.checkBalanceUpdate(oldBalance, newBalance, userId)) {
          const endOfDayPrice = await this.getEndOfDayPrice(oldStock.code)
          const newBody = await CurrentStockService.convertBodyToUpdate(
            oldStock,
            rest,
            endOfDayPrice,
            isBuy,
            userId
          )

          if (newBody) {
            const currentStocks = await CurrentStockService.updateCurrentStock(
              oldStock.code,
              newBody,
              userId,
              session
            )

            const stock = await Stocks.findByIdAndUpdate(
              new Types.ObjectId(id),
              { ...rest, averagePrice: currentStocks?.averagePrice || 0 },
              { new: true, session }
            )
            await session?.commitTransaction()
            const convertStock = stock?.toObject()
            return convertStock
          }
          throw new BadRequest('This current stock is not available')
        }

        throw new BadRequest("You don't have enough money to do")
      }
      return null
    } catch (error: any) {
      await session.abortTransaction()
      await session.endSession()
      throw new BadRequest(error)
    }
  }

  static removeStock = async (id: string, foundStock: Stock, userId: string) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      await CurrentStockService.updateRemoveStock(foundStock, userId, session)
      const data = await Stocks.findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          isDeleted: true
        },
        { session }
      )

      await session.commitTransaction()
      return data
    } catch (error: any) {
      await session.abortTransaction()
      await session.endSession()
      throw new BadRequest(error.message)
    }
  }

  static getStockStatistics = async (code: string): Promise<any[][]> => {
    const redisCode = `statistic-${code}`
    const foundStockStatistics = await this.redisHandler.get(redisCode)

    if (foundStockStatistics) {
      return foundStockStatistics
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

    await this.redisHandler.save(redisCode, data)
    await this.redisHandler.setExpired(redisCode, expiredTime)

    return data
  }

  static getStockBalance = async (
    userId: string
  ): Promise<{ order: number; sell: number; waiting: number }> => {
    const stocks = await this.getAllStocks({ page: 0, size: 100000000, userId })

    let order = 0
    let sell = 0
    let waiting = 0

    stocks.data.forEach((item) => {
      if (item.status === 'Buy') {
        order += item.orderPrice * item.volume
      }
      if (item.status === 'Sell') {
        sell += item.sellPrice * item.volume
        if (countDays(item.date) <= 2) {
          waiting += item.sellPrice * item.volume
        }
      }
    })

    return { order, sell, waiting }
  }

  static getIndicators = async (code: string) => {
    const redisCode = `indicators-${code}`
    const foundRedisData = await this.redisHandler.get(redisCode)

    if (foundRedisData) {
      return foundRedisData
    }

    const codePrices = await this.getStockStatistics(code)
    if (codePrices.length) {
      const indicator = new Indicator({ data: codePrices?.slice(75) })
      const result = indicator.getResult()
      const data = { ...result, lastPrice: codePrices[codePrices.length - 1][4], code }
      const expiredTime = this.getExpiredTime()
      await this.redisHandler.save(redisCode, JSON.stringify(data))
      await this.redisHandler.setExpired(redisCode, expiredTime)
      return data
    }
    return []
  }

  static getBoardStocks = async (pagination: { page: number; size: number; search: string }) => {
    const code = 'board'
    const foundRedisData = await this.redisHandler.get(code)

    if (foundRedisData) {
      const data = filterBoardStocks(foundRedisData, pagination)
      return data
    }

    const response = await ThirdPartyService.getBoard()

    const data = filterBoardStocks(response, pagination)
    const expiredTime = this.getExpiredTime()
    await this.redisHandler.save(code, JSON.stringify(response))
    await this.redisHandler.setExpired(code, expiredTime)
    return data
  }

  static getAllStocksIndicators = async () => {
    try {
      const response = await StockService.getWatchList()

      const arr = response?.flatMap((item: any) => item.symbols)
      const uniqueArr = [...new Set(arr)] as string[]

      if (uniqueArr.length > 0) {
        const chunkSize = Math.ceil(uniqueArr.length / 1) // Calculate the size of each chunk

        // Split uniqueArr into chunks
        const arrChunks = []
        for (let i = 0; i < uniqueArr.length; i += chunkSize) {
          arrChunks.push(uniqueArr?.slice(i, i + chunkSize))
        }

        let indicators: any[] = []
        await Promise.all(
          arrChunks.map(async (items) => {
            const itemData = await Promise.all(
              items.map(async (code) => {
                return await StockService.getIndicators(code)
              })
            )
            indicators.push(...itemData)
          })
        )

        return indicators.flat()
      }
      return []
    } catch (error) {
      console.error('An error occurred:', error)
      return []
    }
  }

  static refreshTime = async () => {
    this.redisHandler.removeKeys('statistic')
    this.redisHandler.removeKeys('fa')
    this.redisHandler.removeKeys('indicators')
    this.redisHandler.removeKeys('watch-lists')
    this.redisHandler.removeKeys('board')
    this.redisHandler.removeKeys('update-countdown')
    this.redisHandler.save('refresh-code', moment().utc())
    return moment().utc()
  }

  static getAllKeys = async () => {
    const keys = await this.redisHandler.getAllKeys('indicators')
    return keys
  }

  static getRecommended = async (filters: RecommendedFilter) => {
    try {
      const stocksIndicators = await this.getAllStocksIndicators()

      if (!stocksIndicators?.length) {
        return []
      }

      const latestStrongStocks = stocksIndicators.map((stock) => {
        const { rsi, macd, mfi, stoch, stochRSI } = stock
        const { d: stochD, k: stochK } = stoch
        const { d: stochRSID, k: stochRSIK } = stochRSI

        const stochDLine = stochD[stochD.length - 1]
        const stochKLine = stochK[stochK.length - 1]
        const stochRSIDLine = stochRSID[stochRSID.length - 1]
        const stochRSIKLine = stochRSIK[stochRSIK.length - 1]

        return {
          rsi: rsi[rsi.length - 1],
          macd: {
            macd: macd.macd[macd.macd.length - 1],
            signal: macd.signal[macd.signal.length - 1]
          },
          mfi: mfi[mfi.length - 1],
          stoch: {
            k: stochKLine,
            d: stochDLine
          },
          stochRSI: {
            k: stochRSIKLine,
            d: stochRSIDLine
          },
          lastPrice: stock.lastPrice,
          code: stock.code
        }
      })

      const strongStocks = latestStrongStocks?.filter((stock: any) => {
        const { rsi, macd, mfi, stoch, stochRSI } = stock

        const stochD = stoch.d
        const stochK = stoch.k

        const stochRSID = stochRSI.d
        const stochRSIK = stochRSI.k

        const subtractedMACD = macd.macd - macd.signal

        return (
          subtractedMACD < (filters?.macd?.[1] ?? 100) &&
          subtractedMACD > (filters?.macd?.[0] ?? 0) &&
          rsi < (filters?.rsi?.[1] ?? 100) &&
          rsi > (filters?.rsi?.[0] ?? 0) &&
          stochD < (filters?.stoch?.[1] ?? 100) &&
          stochK < (filters?.stoch?.[1] ?? 100) &&
          stochD > (filters?.stoch?.[0] ?? 0) &&
          stochK > (filters?.stoch?.[0] ?? 0) &&
          stochRSID < (filters?.stochRSI?.[1] ?? 100) &&
          stochRSIK < (filters?.stochRSI?.[1] ?? 100) &&
          stochRSID > (filters?.stochRSI?.[0] ?? 0) &&
          stochRSIK > (filters?.stochRSI?.[0] ?? 0) &&
          mfi < (filters?.mfi?.[1] ?? 100) &&
          mfi > (filters?.mfi?.[0] ?? 0)
        )
      })

      return strongStocks
    } catch (error) {
      console.error('Error fetching stock indicators:', error)
      return []
    }
  }

  static getRefreshTime = async () => {
    const redis = await this.redisHandler.get('refresh-code')
    if (redis) {
      return redis
    }
    return moment().utc()
  }
}

cron.schedule(
  '05 15h * * *',
  async () => {
    await StockService.refreshTime()
    await StockService.getAllStocksIndicators()
  },
  {
    timezone: 'Asia/Bangkok'
  }
)

export default StockService
