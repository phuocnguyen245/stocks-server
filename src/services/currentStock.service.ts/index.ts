import { BadRequest } from '../../core/error.response.ts'
import { CurrentStocks } from '../../models/currentStock.model.ts'
import { Stock, type CurrentStock } from '../../types/types.js'

class CurrentStockService {
  static getCurrentStocks = async () => {
    const stocks = await CurrentStocks.find().lean()
    return stocks
  }

  static getCurrentStockByCode = async (code: string) => {
    const stock = await CurrentStocks.findOne({ code }).lean()
    return stock
  }

  static createCurrentStock = async (body: CurrentStock) => {
    const stock = await CurrentStocks.create({ ...body })
    return stock.toObject()
  }

  static updateCurrentStock = async (code: string, body: CurrentStock) => {
    const updatedCurrentStock = await CurrentStocks.findOneAndUpdate(
      { code },
      { ...body },
      { isNew: true }
    )
    return updatedCurrentStock?.toObject()
  }

  static removeCurrentStock = async (code: string) => {
    return await CurrentStocks.findOneAndDelete({ code })
  }

  static createOrUpdateCurrentStock = async (body: Stock, endOfDayPrice: number) => {
    const { code, purchasePrice, quantity, status } = body
    const foundCurrentStock = await this.getCurrentStockByCode(code)
    let currentStockBody: CurrentStock

    if (foundCurrentStock) {
      const { quantity: foundCurrentStockQuantity, average: foundCurrentStockAverage } =
        foundCurrentStock

      let currentQuantity = 0
      let average = 0
      if (status === 'Buy') {
        currentQuantity = foundCurrentStockQuantity + quantity
        average =
          (foundCurrentStockAverage * foundCurrentStockQuantity + purchasePrice * quantity) /
          currentQuantity
      } else {
        currentQuantity = foundCurrentStockQuantity - quantity
        average = foundCurrentStock.average
      }

      if (currentQuantity < 0) {
        throw new BadRequest("This stocks doesn't have enough quantity")
      }
      if (currentQuantity === 0) {
        return this.removeCurrentStock(code)
      }
      const ratio = Number(((endOfDayPrice - average) / average).toFixed(2))
      currentStockBody = {
        code,
        quantity: currentQuantity,
        currentPrice: endOfDayPrice,
        average: Number(average.toFixed(2)),
        ratio,
        actualGain: Number(((endOfDayPrice - average) * currentQuantity).toFixed(2))
      }
      return await this.updateCurrentStock(code, currentStockBody)
    }

    if (status === 'Sell') {
      throw new BadRequest("Can't do it")
    }

    currentStockBody = {
      code,
      average: Number(purchasePrice.toFixed(2)),
      currentPrice: endOfDayPrice,
      quantity,
      ratio: Number(((endOfDayPrice - purchasePrice) / purchasePrice).toFixed(2)),
      actualGain: (endOfDayPrice - purchasePrice) * quantity
    }
    return await this.createCurrentStock(currentStockBody)
  }
}
export default CurrentStockService
