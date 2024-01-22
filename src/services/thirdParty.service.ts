import axios from 'axios'
import https from 'https'

class ThirdPartyService {
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
    } catch (error) {
      throw new Error(error as string)
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
      return response.data
    } catch (error) {
      throw new Error(error as string)
    }
  }
}
export default ThirdPartyService
