import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { CREATED, DELETED, OK, UPDATED } from '../core/success.response.ts'
import StockService from '../services/stocks.service.ts'
import { PagePagination, RequestWithUser, Stock, StockWithUserId, Target } from '../types/types.js'
const message = {
  NOTFOUND: "Stock or Current Stock wasn't found",
  DELETED: 'Stock has been deleted',
  MISSING_CODE: 'Missing code',
  WATCH_LIST: 'Get watch list successfully',
  STATISTIC: 'Get statistic successfully',
  UPDATED: 'Stock has successfully updated'
}

class StocksController {
  static formatBody = (body: Stock, currentStock?: Stock) => {
    let data: Stock = {
      code: '',
      date: '',
      volume: 0,
      orderPrice: 0,
      sellPrice: 0,
      status: 'Buy',
      userId: new Types.ObjectId('657ec8a90ac6d9841f7c55cd'),
      stop: [],
      take: []
    }

    if (currentStock) {
      data = { ...currentStock }
    }

    ;((Object.keys(body) as Array<keyof Stock>) || [])?.forEach((item: keyof Stock) => {
      if (item === 'code' || item === 'date' || item === 'status') {
        return (data = { ...data, [item]: body[item] ?? '' })
      } else if (item === 'userId') {
        return (data = {
          ...data,
          userId: new Types.ObjectId(body[item]) ?? data.userId
        })
      } else if (item === 'take' || item === 'stop') {
        return (data = {
          ...data,
          take: body.take,
          stop: body.stop
        })
      }

      return (data = { ...data, [item]: Number(body[item] ?? 0) })
    })

    return data
  }

  static getAll = async (req: RequestWithUser, res: Response) => {
    const userId = req.id
    const { page, size, sort, orderBy } = req.query as unknown as PagePagination<Stock>

    const numberPage = Number(page)
    const numberSize = Number(size)
    const data = await StockService.getAllStocks({
      userId,
      page: numberPage,
      size: numberSize,
      sort,
      orderBy
    })

    return new OK({
      data
    }).send(res)
  }

  static getById = async (req: RequestWithUser, res: Response) => {
    const { id } = req.params
    const { id: userId } = req
    if (!id) {
      return new BadRequest('Id is missing')
    }

    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }
    return new OK({ data: foundStock }).send(res)
  }

  static create = async (req: RequestWithUser, res: Response) => {
    const { body, id: userId } = req

    const data = this.formatBody(body)
    console.log(body, data)

    const newStock = await StockService.createStock(data, userId)

    return new CREATED({ data: newStock }).send(res)
  }

  static update = async (req: RequestWithUser, res: Response) => {
    const {
      body,
      params: { id },
      id: userId
    } = req

    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }

    const stock = this.formatBody(body, foundStock)

    const updatedStock = await StockService.updateStock(id, stock, userId)

    return new UPDATED({ data: updatedStock, message: message.UPDATED }).send(res)
  }

  static remove = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { id } = req.params
    const { id: userId } = req
    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }
    await StockService.removeStock(id, foundStock, userId)

    return new DELETED({ message: message.DELETED }).send(res)
  }

  static getStatistic = async (req: Request, res: Response) => {
    const { code } = req.params
    if (!code) {
      throw new BadRequest(message.MISSING_CODE)
    }
    const data = await StockService.getStockStatistics(code.toUpperCase())
    return new OK({
      data: {
        data,
        totalItems: data.length
      },
      message: message.STATISTIC
    }).send(res)
  }

  static getWatchLists = async (req: Request, res: Response) => {
    const watchLists = await StockService.getWatchList()
    return new OK({ data: watchLists, message: message.WATCH_LIST }).send(res)
  }

  static getIndicators = async (req: Request, res: Response) => {
    const { code } = req.params
    const data = await StockService.getIndicators(code)
    return new OK({ data }).send(res)
  }

  static getBoardStocks = async (req: RequestWithUser, res: Response) => {
    const search = req.query.search as string
    const { page = 0, size = 10 } = req.query
    const data = await StockService.getBoardStocks({
      search,
      page: Number(page),
      size: Number(size)
    })
    return new OK({ data }).send(res)
  }

  static getStrongStocks = async (req: Request, res: Response) => {
    const data = await StockService.filterStrongStocks()
    return new OK({ data }).send(res)
  }
}

export default StocksController
