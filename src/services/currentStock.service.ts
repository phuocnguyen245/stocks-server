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

  static convertBodyToCreate = async (
    stock: Stock,
    endOfDayPrice: number,
    isBuy: boolean
  ): Promise<CurrentStock> => {
    const { code, orderPrice, volume, status, _id } = stock
    const foundCurrentStock = await this.getCurrentStockByCode(code)
    let newVolume = 0
    let newAveragePrice = 0

    if (foundCurrentStock) {
      if (isBuy) {
        newVolume = foundCurrentStock.volume + volume
        newAveragePrice =
          (foundCurrentStock.averagePrice * volume + orderPrice * volume) / newVolume
      } else {
        newVolume = foundCurrentStock.volume - volume
        newAveragePrice = foundCurrentStock.averagePrice

        if (newVolume < 0) {
          throw new BadRequest("This stocks doesn't have enough volume")
        }

        if (newVolume === 0) {
          this.removeCurrentStock(code)
        }
      }
      const ratio = Number(((endOfDayPrice - newAveragePrice) / newAveragePrice).toFixed(2))
      const investedValue = ((endOfDayPrice - newAveragePrice) * newVolume).toFixed(2)
      const currentStock: CurrentStock = {
        code,
        averagePrice: newAveragePrice,
        volume: newVolume,
        ratio,
        marketPrice: endOfDayPrice,
        investedValue: Number(investedValue)
      }
      return currentStock
    }

    if (!isBuy) {
      throw new BadRequest('Can not')
    }

    const currentStock: CurrentStock = {
      code,
      averagePrice: Number(orderPrice.toFixed(2)),
      marketPrice: endOfDayPrice,
      volume,
      ratio: Number(((endOfDayPrice - orderPrice) / orderPrice).toFixed(2)),
      investedValue: (endOfDayPrice - orderPrice) * volume
    }
    return currentStock
  }

  static convertBodyToUpdate = async (
    oldStock: Stock,
    body: Stock,
    endOfDayPrice: number,
    isBuy: boolean
  ): Promise<CurrentStock | null> => {
    const foundCurrentStock = await this.getCurrentStockByCode(oldStock.code)

    if (foundCurrentStock) {
      const { volume, orderPrice } = body
      let newVolume = oldStock.volume
      let newAveragePrice = 0
      if (isBuy) {
        if (volume && volume > 0) {
          newVolume = foundCurrentStock.volume - oldStock.volume + volume
        }
        newAveragePrice =
          (foundCurrentStock.averagePrice * foundCurrentStock.volume -
            oldStock.orderPrice * oldStock.volume +
            volume * orderPrice) /
          newVolume
        const currentStock: CurrentStock = {
          ...body,
          volume,
          averagePrice: newAveragePrice,
          marketPrice: endOfDayPrice,
          investedValue: (endOfDayPrice - newAveragePrice) * newVolume,
          ratio: Number(((endOfDayPrice - newAveragePrice) / newAveragePrice).toFixed(2))
        }
        return currentStock
      }
      if (volume && volume > 0) {
        newVolume = foundCurrentStock.volume + oldStock.volume - volume
      }
      const currentStock: CurrentStock = {
        ...body,
        volume: newVolume,
        averagePrice: foundCurrentStock.averagePrice,
        marketPrice: endOfDayPrice,
        investedValue: (endOfDayPrice - foundCurrentStock.averagePrice) * newVolume,
        ratio: Number(
          (
            (endOfDayPrice - foundCurrentStock.averagePrice) /
            foundCurrentStock.averagePrice
          ).toFixed(2)
        )
      }
      return currentStock
    }

    return null
  }
}
export default CurrentStockService
