import PaymentService from './payment.service.ts'
import StockService from './stocks.service.ts'

class AssetsService {
  static getAsset = async () => {
    const paymentBalance = await PaymentService.getBalance()
    const stockBalance = await StockService.getSellStockBalance()
    return {
      paymentBalance,
      stockBalance
    }
  }
}
export default AssetsService
