import { Request, Response } from 'express'
import { CREATED, DELETED, OK, UPDATED } from '../core/success.response.ts'
import StockService from '../services/stocks.service.ts/index.ts'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { Stock } from '../types/types.js'
import { Types } from 'mongoose'

const message = {
  NOTFOUND: "Stock wasn't found",
  DELETED: 'Stock has been deleted',
}

class StocksController {
  static formatBody = (body: Stock, currentStock?: Stock) => {
    let data: Stock = {
      code: '',
      date: '',
      quantity: 0,
      purchasePrice: 0,
      status: 'Buy',
      userId: new Types.ObjectId('657ec8a90ac6d9841f7c55cd'),
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
          userId: new Types.ObjectId(body[item]) ?? data.userId,
        })
      }
      return (data = { ...data, [item]: Number(body[item] ?? 0) })
    })

    return data
  }

  static getAll = async (req: Request, res: Response) => {
    const stocks = await StockService.getAllStocks()
    return new OK({ data: stocks }).send(res)
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
      params: { id },
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
}

export default StocksController
