import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { CREATED, DELETED, OK, UPDATED } from '../core/success.response.ts'
import StockService from '../services/stocks.service.ts'
import { PagePagination, Stock } from '../types/types.js'
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
      userId: new Types.ObjectId('657ec8a90ac6d9841f7c55cd')
    }

    if (currentStock) {
      data = { ...currentStock }
    }

    ;(Object.keys(body) as Array<keyof Stock>).forEach((item: keyof Stock) => {
      if (item === 'code' || item === 'date' || item === 'status') {
        return (data = { ...data, [item]: body[item] ?? '' })
      } else if (item === 'userId') {
        return (data = {
          ...data,
          userId: new Types.ObjectId(body[item]) ?? data.userId
        })
      }
      return (data = { ...data, [item]: Number(body[item] ?? 0) })
    })

    return data
  }

  static getAll = async (req: Request, res: Response) => {
    const { page, size, sort, orderBy } = req.query as unknown as PagePagination<Stock>
    const numberPage = Number(page)
    const numberSize = Number(size)
    const data = await StockService.getAllStocks({
      page: numberPage,
      size: numberSize,
      sort,
      orderBy
    })

    return new OK({
      data
    }).send(res)
  }

  static getById = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) {
      return new BadRequest('Id is missing')
    }

    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }
    return new OK({ data: foundStock }).send(res)
  }

  static create = async (req: Request, res: Response) => {
    const { body } = req

    const data = this.formatBody(body)

    const newStock = await StockService.createStock(data)

    return new CREATED({ data: newStock }).send(res)
  }

  static update = async (req: Request, res: Response) => {
    const {
      body,
      params: { id }
    } = req

    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }

    const stock = this.formatBody(body, foundStock)

    const updatedStock = await StockService.updateStock(id, stock)

    return new UPDATED({ data: updatedStock, message: message.UPDATED }).send(res)
  }

  static remove = async (req: Request, res: Response) => {
    const { id } = req.params
    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }
    await StockService.removeStock(id, foundStock)

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
    return new OK({ data: data }).send(res)
  }
}

export default StocksController
