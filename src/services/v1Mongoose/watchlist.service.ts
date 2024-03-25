import { Types } from 'mongoose'
import { WatchList } from '../../models/watchlist.model'
import RedisHandler from '../../config/redis'
import ThirdPartyService from './thirdParty.service'
import { findDuplicateStocks } from '../utils'
import StockService from './stocks.service'

class WatchListService {
  static redisHandler = new RedisHandler()

  static getWatchList = async (userId: string) => {
    const redisCode = 'watch-lists'
    const foundWatchList = await this.redisHandler.get(redisCode)
    if (foundWatchList) {
      return foundWatchList
    }

    const [boardList, faWatchList] = await Promise.all([
      ThirdPartyService.getBoard(),
      WatchList.find({ userId }).lean()
    ])
    const stocksInList =
      faWatchList.flatMap((item) => item?.attributes.flatMap((item) => item.items.symbols)) || []
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
    const expiredTime = StockService.getExpiredTime()
    await this.redisHandler.save(redisCode, watchList)
    await this.redisHandler.setExpired(redisCode, expiredTime)
    return watchList
  }
  static createOrUpdateWatchList = async (userId: string, body: any) => {
    const watchList = await WatchList.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      body,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    )
    return watchList
  }
}
export default WatchListService
