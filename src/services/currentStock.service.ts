import { BadRequest } from '../core/error.response.ts'
import { CurrentStocks } from '../models/currentStock.model.ts'
import { Stock, type CurrentStock } from '../types/types.js'

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
    const { code, orderPrice, volume, status } = body
    const foundCurrentStock = await this.getCurrentStockByCode(code)
    let currentStockBody: CurrentStock

    if (foundCurrentStock) {
      const { volume: foundCurrentStockQuantity, averagePrice: foundCurrentStockAverage } =
        foundCurrentStock

      let currentQuantity = 0
      let average = 0
      if (status === 'Buy') {
        currentQuantity = foundCurrentStockQuantity + volume
        average =
          (foundCurrentStockAverage * foundCurrentStockQuantity + orderPrice * volume) /
          currentQuantity
      } else {
        currentQuantity = foundCurrentStockQuantity - volume
        average = foundCurrentStock.averagePrice
      }

      if (currentQuantity < 0) {
        throw new BadRequest("This stocks doesn't have enough volume")
      }
      if (currentQuantity === 0) {
        return this.removeCurrentStock(code)
      }
      const ratio = Number(((endOfDayPrice - average) / average).toFixed(2))
      currentStockBody = {
        code,
        volume: currentQuantity,
        marketPrice: endOfDayPrice,
        averagePrice: Number(average.toFixed(2)),
        ratio,
        investedValue: Number(((endOfDayPrice - average) * currentQuantity).toFixed(2))
      }
      return await this.updateCurrentStock(code, currentStockBody)
    }

    if (status === 'Sell') {
      throw new BadRequest("Can't do it")
    }

    currentStockBody = {
      code,
      averagePrice: Number(orderPrice.toFixed(2)),
      marketPrice: endOfDayPrice,
      volume,
      ratio: Number(((endOfDayPrice - orderPrice) / orderPrice).toFixed(2)),
      investedValue: (endOfDayPrice - orderPrice) * volume
    }
    return await this.createCurrentStock(currentStockBody)
  }
}
export default CurrentStockService
