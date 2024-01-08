import { Request, Response } from 'express'
import CurrentStockService from '../services/currentStock.service.ts'
import { DELETED, OK } from '../core/success.response.ts'
import { CurrentStock, PagePagination } from '../types/types.js'

const message = {
  GET_ALL: 'Get all current stocks successfully',
  REMOVE: 'Remove current stock successfully'
}

class CurrentStockController {
  static getCurrentStocks = async (req: Request, res: Response) => {
    const { page, size, sort, orderBy } = req.query as unknown as PagePagination<CurrentStock>
    const numberPage = Number(page)
    const numberSize = Number(size)
    const data = await CurrentStockService.getCurrentStocks({
      page: numberPage,
      size: numberSize,
      orderBy,
      sort
    })

    return new OK({
      data,
      message: message.GET_ALL
    }).send(res)
  }

  static removeCurrentStock = async (req: Request, res: Response) => {
    await CurrentStockService.removeCurrentStock(req.params.code)
    return new DELETED({ data: null, message: message.REMOVE }).send(res)
  }
}

export default CurrentStockController
