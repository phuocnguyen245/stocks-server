import PaymentService from './payment.service.ts'
import StockService from './stocks.service.ts'

class AssetsService {
  static getAsset = async () => {
    const payment = await PaymentService.getBalance()
    const stock = await StockService.getStockBalance()
    return {
      payment,
      stock
    }
  }
}
export default AssetsService
