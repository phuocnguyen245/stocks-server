import { CREATED, OK } from '../core/success.response'
import WatchListService from '../services/watchlist.service'
import { RequestWithUser } from '../types/types'
import { Response } from 'express'

class WatchListController {
  static getWatchList = async (req: RequestWithUser, res: Response) => {
    const userId = req.id
    const watchList = await WatchListService.getWatchList(userId)
    return new OK({ data: watchList }).send(res)
  }
  static createOrUpdateWatchList = async (req: RequestWithUser, res: Response) => {
    const userId = req.id
    const body = req.body
    const data = await WatchListService.createOrUpdateWatchList(userId, body)
    return new OK({ data }).send(res)
  }
}
export default WatchListController
