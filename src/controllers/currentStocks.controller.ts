import { Request, Response } from 'express'
import CurrentStockService from '../services/currentStock.service.ts/index.ts'
import { DELETED, OK } from '../core/success.response.ts'

const message = {
  GET_ALL: 'Get all current stocks successfully'
}

class CurrentStockController {
  static getCurrentStocks = async (req: Request, res: Response) => {
    const currentStocks = await CurrentStockService.getCurrentStocks()
    const length = currentStocks.length
    return new OK({
      data: { data: currentStocks, page: 1, size: length, totalItems: currentStocks.length },
      message: message.GET_ALL
    }).send(res)
  }
  static removeCurrentStock = async (req: Request, res: Response) => {
    await CurrentStockService.removeCurrentStock(req.params.code)
    return new DELETED({ data: null, message: 'Remove current stock successfully' }).send(res)
  }
}

export default CurrentStockController
