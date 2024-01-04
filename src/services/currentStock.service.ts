import { BadRequest } from '../core/error.response.ts'
import { CurrentStocks } from '../models/currentStock.model.ts'
import { Stock, type CurrentStock } from '../types/types.js'
import { convertToDecimal } from '../utils/index.ts'

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
    foundCurrentStock: CurrentStock | null,
    endOfDayPrice: number,
    isBuy: boolean
  ) => {
    const { code, orderPrice, volume } = stock
    let newVolume = 0
    let newAveragePrice = 0

    if (foundCurrentStock) {
      if (isBuy) {
        newVolume = foundCurrentStock.volume + volume

        newAveragePrice = convertToDecimal(
          (foundCurrentStock.averagePrice * foundCurrentStock.volume + orderPrice * volume) /
            newVolume
        )
      } else {
        newVolume = foundCurrentStock.volume - volume
        newAveragePrice = convertToDecimal(foundCurrentStock.averagePrice)

        if (newVolume < 0) {
          throw new BadRequest("This stocks doesn't have enough volume")
        }

        if (newVolume === 0) {
          this.removeCurrentStock(code)
        }
      }
      const ratio = convertToDecimal((endOfDayPrice - newAveragePrice) / newAveragePrice)
      const investedValue = convertToDecimal((endOfDayPrice - newAveragePrice) * newVolume)
      const currentStock: CurrentStock = {
        code,
        averagePrice: newAveragePrice,
        volume: newVolume,
        ratio,
        marketPrice: endOfDayPrice,
        investedValue
      }

      return await CurrentStockService.updateCurrentStock(code, currentStock)
    }

    if (!isBuy) {
      throw new BadRequest('Can not')
    }

    const currentStock: CurrentStock = {
      code,
      averagePrice: convertToDecimal(orderPrice),
      marketPrice: endOfDayPrice,
      volume,
      ratio: convertToDecimal((endOfDayPrice - orderPrice) / orderPrice),
      investedValue: (endOfDayPrice - orderPrice) * volume
    }
    return await CurrentStockService.createCurrentStock(currentStock)
  }

  static convertBodyToUpdate = async (
    oldStock: Stock,
    body: Stock,
    endOfDayPrice: number,
    isBuy: boolean
  ): Promise<CurrentStock | null> => {
    const foundCurrentStock = await this.getCurrentStockByCode(oldStock.code)
    //! Update sai
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
          volume: newVolume,
          averagePrice: convertToDecimal(newAveragePrice),
          marketPrice: endOfDayPrice,
          investedValue: convertToDecimal((endOfDayPrice - newAveragePrice) * newVolume),
          ratio: convertToDecimal((endOfDayPrice - newAveragePrice) / newAveragePrice)
        }
        return currentStock
      }
      if (volume && volume > 0) {
        newVolume = foundCurrentStock.volume + oldStock.volume - volume
      }
      const currentStock: CurrentStock = {
        ...body,
        volume: newVolume,
        averagePrice: convertToDecimal(foundCurrentStock.averagePrice),
        marketPrice: endOfDayPrice,
        investedValue: convertToDecimal(
          (endOfDayPrice - foundCurrentStock.averagePrice) * newVolume
        ),
        ratio: convertToDecimal(
          (endOfDayPrice - foundCurrentStock.averagePrice) / foundCurrentStock.averagePrice
        )
      }
      return currentStock
    }

    return null
  }
}
export default CurrentStockService
