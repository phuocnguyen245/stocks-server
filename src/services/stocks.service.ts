import axios from 'axios'
import moment from 'moment'
import mongoose, { FilterQuery, Types } from 'mongoose'
import RedisHandler from '../config/redis.ts'
import { BadRequest } from '../core/error.response.ts'
import { Stocks } from '../models/stock.model.ts'
import type { PagePagination, RecommendedFilter, Stock } from '../types/types.js'
import { countDays, dateStringToNumber } from '../utils/index.ts'
import AssetsService from './assets.service.ts'
import CurrentStockService from './currentStock.service.ts'
import ThirdPartyService from './thirdParty.service.ts'
import { filterBoardStocks, findDuplicateStocks } from './utils/index.ts'
import Indicator from './utils/indicator.ts'
import cron from 'node-cron'

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
    const paymentBalance = assets.payment / 1000
    const stocksBalance = assets.stock.sell - assets.stock.order + assets.stock.waiting
    const totalBalance = paymentBalance + stocksBalance
    return totalBalance
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
    if (totalBalance + oldBalance >= balance) {
      return true
    }
    return false
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
    const redisCode = 'fa-watch-lists'
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
    const arr = findDuplicateStocks(boardList.data, sortedList)
    const watchList = faWatchList.map((item: any) => {
      const data: any = []
      item.symbols.forEach((code: string) => {
        arr.forEach((arrItem: any) => {
          if (arrItem.liveboard.Symbol === code) {
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
        await this.redisHandler.save(redisCode, response?.reverse() as EndOfDayStock[])
        await this.redisHandler.setExpired(redisCode, expiredTime)
        return response
      }
    } catch (error) {
      console.log(error)
    }
  }

  static getAllStocks = async (
    pagination: PagePagination<Stock>,
    extraFilter?: FilterQuery<Stock>
  ) => {
    const { page, size, sort, orderBy, userId } = pagination

    const sortPage = page || 0
    const sortSize = size || 10
    const order = orderBy || 'desc'

    const filter: FilterQuery<Stock> = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
      ...extraFilter
    }

    const getData = async () =>
      await Stocks.find(filter)
        .sort([
          ['status', 1],
          [`${sort ?? 'createdAt'}`, order]
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
        if (await this.checkBalanceBuy(body.orderPrice * body.volume, userId)) {
          stock = (await Stocks.create(
            [{ ...body, userId: new Types.ObjectId(userId), marketPrice: endOfDayPrice }],
            {
              session
            }
          )) as any
        } else {
          throw Error("You don't have enough money to do")
        }
      } else {
        stock = (await Stocks.create([{ ...body, userId: new Types.ObjectId(userId) }], {
          session
        })) as any
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
      throw new BadRequest(error.message)
    } finally {
      session.endSession()
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
        const oldBalance = oldStock.orderPrice * oldStock.volume
        const newBalance = body.orderPrice * body.volume
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
            await CurrentStockService.updateCurrentStock(oldStock.code, newBody, userId, session)

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
        throw Error("You don't have enough money to do")
      }
      return null
    } catch (error: any) {
      await session.abortTransaction()
      throw new BadRequest(error)
    } finally {
      session.endSession()
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
      session.abortTransaction()
      throw new BadRequest(error.message)
    } finally {
      session.endSession()
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

    return { order, sell: (sell * (100 - 0.25)) / 100, waiting: (waiting * (100 - 0.25)) / 100 }
  }

  static getIndicators = async (code: string) => {
    const redisCode = `indicators-${code}`
    const foundRedisData = await this.redisHandler.get(redisCode)

    if (foundRedisData) {
      return JSON.parse(foundRedisData)
    }

    const codePrices = await this.getStockStatistics(code)
    const indicator = new Indicator({ data: codePrices.slice(75) })
    const result = indicator.getResult()
    const data = { ...result, lastPrice: codePrices[codePrices.length - 1][4], code }
    const expiredTime = this.getExpiredTime()
    await this.redisHandler.save(redisCode, JSON.stringify(data))
    await this.redisHandler.setExpired(redisCode, expiredTime)
    return data
  }

  static getBoardStocks = async (pagination: { page: number; size: number; search: string }) => {
    const code = 'board'
    const foundRedisData = await this.redisHandler.get(code)
    if (foundRedisData) {
      const parseRedisData = JSON.parse(foundRedisData)
      const data = filterBoardStocks(parseRedisData.data, pagination)
      return data
    }

    const response = await ThirdPartyService.getBoard()

    const data = filterBoardStocks(response.data, pagination)
    const expiredTime = this.getExpiredTime()
    await this.redisHandler.save(code, JSON.stringify(response))
    await this.redisHandler.setExpired(code, expiredTime)
    return data
  }

  static getAllStocksIndicators = async () => {
    let length = 0
    let firstArr = [] as any[]
    let secondArr = [] as any[]
    let thirdArr = [] as any[]
    let restArr = [] as any[]

    do {
      try {
        const response = await StockService.getWatchList()
        const arr = response?.flatMap((item: any) => item.symbols)
        const uniqueArr = [...new Set(arr)] as string[]

        const four = Math.ceil(uniqueArr.length / 4)

        firstArr = await Promise.all(
          uniqueArr.slice(0, four).map((code) => StockService.getIndicators(code))
        )
        secondArr = await Promise.all(
          uniqueArr.slice(four, four * 2).map((code) => StockService.getIndicators(code))
        )
        thirdArr = await Promise.all(
          uniqueArr.slice(four * 2, four * 3).map((code) => StockService.getIndicators(code))
        )
        restArr = await Promise.all(
          uniqueArr.slice(four).map((code) => StockService.getIndicators(code))
        )

        length = response?.length ?? 0
      } catch (error) {
        console.error('An error occurred:', error)
      }
    } while (length === 0)

    return [...firstArr, ...secondArr, ...thirdArr, ...restArr]
  }

  static refreshTime = () => {
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
    const stocksIndicators = await this.getAllStocksIndicators()
    if (stocksIndicators?.length) {
      const strongStocks = stocksIndicators.filter((item: any) => {
        const { rsi, macd, mfi, stoch, stochRSI } = item
        const averageRSI =
          rsi.slice(rsi.length - 2).reduce((acc: number, item: number) => acc + item, 0) / 2

        const macdLine = macd.macd[macd.macd.length - 1]
        const signalLine = macd.signal[macd.signal.length - 1]

        const averageMFI =
          mfi.slice(mfi.length - 2).reduce((acc: number, item: number) => acc + item, 0) / 2

        const stochDLine = stoch.d[stoch.d.length - 1]
        const stochKLine = stoch.k[stoch.k.length - 1]

        const stochRSIDLine = stochRSI.d[stochRSI.d.length - 1]
        const stochRSIKLine = stochRSI.k[stochRSI.k.length - 1]

        const subtractedMACD = macdLine - signalLine
        return (
          subtractedMACD < (filters?.macd?.[1] || 100) &&
          subtractedMACD > (filters?.macd?.[0] || 0) &&
          averageRSI < (filters?.rsi?.[1] || 100) &&
          averageRSI > (filters?.rsi?.[0] || 0) &&
          stochDLine < (filters?.stoch?.[1] || 100) &&
          stochKLine < (filters?.stoch?.[1] || 100) &&
          stochDLine > (filters?.stoch?.[0] || 0) &&
          stochKLine > (filters?.stoch?.[0] || 0) &&
          stochRSIDLine < (filters?.stoshRSI?.[1] || 100) &&
          stochRSIKLine < (filters?.stoshRSI?.[1] || 100) &&
          stochRSIDLine > (filters?.stoshRSI?.[0] || 0) &&
          stochRSIKLine > (filters?.stoshRSI?.[0] || 0) &&
          averageMFI < (filters?.mfi?.[1] || 100) &&
          averageMFI > (filters?.mfi?.[0] || 0)
        )
      })
      return strongStocks
    }
    return stocksIndicators
  }

  static getRefreshTime = () => {
    const redis = this.redisHandler.get('refresh-code')
    if (redis) {
      return redis
    }
    return moment().utc()
  }
}

cron.schedule(
  '43 17 * * *',
  async () => {
    await StockService.refreshTime()
    await StockService.getAllStocksIndicators()
  },
  {
    timezone: 'Asia/Bangkok'
  }
)

export default StockService
