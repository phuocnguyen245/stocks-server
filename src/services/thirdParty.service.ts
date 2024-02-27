import axios from 'axios'
import https from 'https'
import RedisHandler from '../config/redis'
import StockService from './stocks.service'

class ThirdPartyService {
  static redisHandler = new RedisHandler()
  static getStockHistorical = async (code: string, today: string) => {
    try {
      const FIRE_ANT_KEY = process.env.FIRE_ANT_KEY
      const response = await axios.get(
        `https://restv2.fireant.vn/symbols/${code}/historical-quotes?startDate=2021-01-05&endDate=${today}&offset=0&limit=250`,
        {
          headers: {
            Authorization: `Bearer ${FIRE_ANT_KEY}`
          }
        }
      )
      return response.data
    } catch (error: any) {
      console.log(code, error.message)
    }
  }

  static getBoard = async () => {
    try {
      const response = await axios.get(
        `https://exchange-dr.stockproxx.com/api/StockExchange/liveboard`,
        {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        }
      )
      const data = response.data
      const expiredTime = StockService.getExpiredTime()
      await this.redisHandler.setExpired('board', expiredTime)
      await this.redisHandler.save('board', JSON.stringify(data))
      return data
    } catch (error) {
      throw new Error(error as string)
    }
  }
}
export default ThirdPartyService
