import PaymentService from './payment.service.ts'
import StockService from './stocks.service.ts'

class AssetsService {
  static getAsset = async (userId: string) => {
    const payment = await PaymentService.getBalance(userId)
    const stock = await StockService.getStockBalance(userId)
    return {
      payment,
      stock
    }
  }
}
export default AssetsService
