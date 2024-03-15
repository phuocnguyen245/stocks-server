import { Types } from 'mongoose'
import { CurrentStocks } from '../models/currentStock.model.ts'
import { Chart, CurrentStock } from '../types/types'
import PaymentService from './payment.service.ts'
import StockService from './stocks.service.ts'

type GroupedData = { [name: string]: number }
class AssetsService {
  static getAsset = async (userId: string) => {
    const topUp = (await PaymentService.getBalance(userId)) / 1000
    const { order, sell, waiting } = await StockService.getStockBalance(userId)

    const [{ marketValue = 0, investedValue = 0, currentStocks = [] }] =
      await CurrentStocks.aggregate([
        {
          $match: { userId: new Types.ObjectId(userId) }
        },
        {
          $group: {
            _id: null,
            marketValue: {
              $sum: { $multiply: ['$marketPrice', '$volume'] }
            },
            investedValue: {
              $sum: { $multiply: ['$averagePrice', '$volume'] }
            },
            currentStocks: {
              $push: '$$ROOT' // Push the entire document into an array
            }
          }
        }
      ])

    const { stocksPercentage, sectorsPercentage } = this.getChartPercentage(
      currentStocks.sort(
        (a: CurrentStock, b: CurrentStock) => b.volume * b.averagePrice - a.volume * a.averagePrice
      ),
      investedValue
    )
    return {
      topUp,
      order,
      sell,
      waiting,
      cash: topUp + sell - order,
      marketValue,
      investedValue,
      profitOrLost: ((sell - order + marketValue) / (topUp ?? 1)) * 100,
      net: topUp + sell - order + marketValue,
      ratePortfolio: ((marketValue - investedValue) / investedValue) * 100,
      sectorsPercentage,
      stocksPercentage
    }
  }

  static getChartPercentage = (data: CurrentStock[], investedValue: number) => {
    let sectors: Chart[] = []
    let stocks: Chart[] = []

    if (!data.length) {
      return {
        stocksPercentage: [{ name: 'Cash', y: 100 }],
        sectorsPercentage: [{ name: 'Cash', y: 100 }]
      }
    }

    data.forEach((currentStocks) => {
      const sector = currentStocks.sector
      const value = (currentStocks.averagePrice ?? 0) * currentStocks.volume
      const y = (value / investedValue) * 100
      sectors.push({ name: sector, y })
      stocks.push({ name: currentStocks.code, y })
    })

    type GroupedData = { [name: string]: number }
    const groupedDataMap: GroupedData = sectors.reduce((map: GroupedData, { name, y }: Chart) => {
      map[name] = (Number(map[name]) || 0) + Number(y)
      return map
    }, {})
    const groupedData: { name: string; y: number }[] = Object.entries(groupedDataMap).map(
      ([name, y]) => ({ name, y })
    )

    return { stocksPercentage: stocks, sectorsPercentage: groupedData }
  }
}
export default AssetsService
