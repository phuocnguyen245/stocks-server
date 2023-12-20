import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { CREATED, DELETED, OK, UPDATED } from '../core/success.response.ts'
import StockService from '../services/stocks.service.ts/index.ts'
import { Stock } from '../types/types.js'

const message = {
  NOTFOUND: "Stock wasn't found",
  DELETED: 'Stock has been deleted',
  MISSING_CODE: 'Missing code'
}

class StocksController {
  static formatBody = (body: Stock, currentStock?: Stock) => {
    let data: Stock = {
      code: '',
      date: '',
      quantity: 0,
      purchasePrice: 0,
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
    const { page, size } = req.params
    const stocks = await StockService.getAllStocks({ page: Number(page), size: Number(size) })

    return new OK({
      data: {
        data: stocks,
        totalItems: stocks.length,
        page,
        size
      }
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

    return new UPDATED({ data: updatedStock }).send(res)
  }

  static remove = async (req: Request, res: Response) => {
    const { id } = req.body
    const foundStock = await StockService.getStockById(id)
    if (!foundStock) {
      throw new NotFound(message.NOTFOUND)
    }
    await StockService.removeStock(id)
    return new DELETED({ message: message.DELETED }).send(res)
  }

  static getCurrent = async (req: Request, res: Response) => {
    const stocks = await StockService.getCurrentStock()

    return new OK({
      data: {
        data: stocks,
        page: 1,
        size: 10,
        totalItems: stocks.length
      }
    }).send(res)
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
      }
    }).send(res)
  }
}

export default StocksController
