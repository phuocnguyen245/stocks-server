import PaymentService from './payment.service.ts'

class AssetsService {
  static getAsset = async () => {
    const total = await PaymentService.getBalance()
    return total
  }
}
export default AssetsService
