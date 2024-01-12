class Indicator {
  data: number[][]
  static data: number[][]

  result: any
  static result: any
  constructor({ data }: { data: number[][] }) {
    this.data = data
    this.result = this.result
  }

  static calculateEMA = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1)
    const ema: number[] = []
    let sum = 0

    for (let i = 0; i < period; i++) {
      sum += data[i]
      ema.push(null as unknown as number)
    }

    ema.push(sum / period)

    for (let i = period + 1; i < data.length; i++) {
      const currentValue = data[i]
      const prevEMA = ema[i - 1]
      const currentEMA = (currentValue - prevEMA) * k + prevEMA
      ema.push(currentEMA)
    }

    return ema
  }

  static calculateMA = (prices: number[], size: number): number[] => {
    const ma: number[] = []

    for (let i = size - 1; i < prices.length; i++) {
      const slicePrices = prices.slice(i - size + 1, i + 1)
      const sum = slicePrices.reduce((acc, price) => acc + price, 0)
      const average = sum / size
      ma.push(average)
    }

    return [...Array.from({ length: size }).map(() => null), ...ma] as unknown as number[]
  }

  static calculateMFI = (data: number[][], period: number): number[] => {
    const volumes: number[] = []
    const mfiValues: number[] = []
    const highPrices: number[] = []
    const lowPrices: number[] = []
    const closePrices: number[] = []

    data.forEach((item) => {
      highPrices.push(item[2])
      lowPrices.push(item[3])
      closePrices.push(item[4])
      volumes.push(item[5])
    })

    for (let i = 0; i < closePrices.length; i++) {
      let positiveFlow = 0
      let negativeFlow = 0

      // Tính toán dòng tiền cho mỗi phiên giao dịch
      for (let j = i - period + 1; j <= i; j++) {
        const typicalPrice = (highPrices[j] + lowPrices[j] + closePrices[j]) / 3
        const moneyFlow = typicalPrice * volumes[j]

        if (typicalPrice > (highPrices[j - 1] + lowPrices[j - 1] + closePrices[j - 1]) / 3) {
          positiveFlow += moneyFlow
        } else if (typicalPrice < (highPrices[j - 1] + lowPrices[j - 1] + closePrices[j - 1]) / 3) {
          negativeFlow += moneyFlow
        }
      }

      const moneyRatio = positiveFlow / negativeFlow
      const mfi = 100 - 100 / (1 + moneyRatio)

      mfiValues.push(mfi)
    }

    return mfiValues
  }

  static calculateRSI = (data: number[], period: number): number[] => {
    const changes: number[] = []
    const gains: number[] = []
    const losses: number[] = []
    const rsis: number[] = []

    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1])
    }

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        gains.push(changes[i])
        losses.push(0)
      } else {
        gains.push(0)
        losses.push(Math.abs(changes[i]))
      }
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

    rsis.push(100 - 100 / (1 + avgGain / avgLoss))

    for (let i = period; i < changes.length; i++) {
      if (changes[i] > 0) {
        avgGain = (avgGain * (period - 1) + changes[i]) / period
        avgLoss = (avgLoss * (period - 1)) / period
      } else {
        avgGain = (avgGain * (period - 1)) / period
        avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period
      }

      rsis.push(100 - 100 / (1 + avgGain / avgLoss))
    }

    return rsis
  }

  static calculateStochasticK = (prices: number[][], period: number): number[] => {
    const result: number[] = []
    const highPrices: number[] = []
    const lowPrices: number[] = []
    const closePrices: number[] = []

    prices.forEach((item) => {
      highPrices.push(item[2])
      lowPrices.push(item[3])
      closePrices.push(item[4])
    })

    for (let i = period - 1; i < closePrices.length; i++) {
      const recentClose = closePrices.slice(i - period + 1, i + 1)
      const recentLow = lowPrices.slice(i - period + 1, i + 1)
      const recentHigh = highPrices.slice(i - period + 1, i + 1)

      const lowestLow = Math.min(...recentLow)
      const highestHigh = Math.max(...recentHigh)

      const currentClose = recentClose[recentClose.length - 1]
      const stochasticK = (100 * (currentClose - lowestLow)) / (highestHigh - lowestLow)
      result.push(stochasticK)
    }

    return result
  }

  static calculateStochasticD = (stochasticKValues: number[], smaPeriod: number): number[] => {
    const result: number[] = []

    for (let i = smaPeriod - 1; i < stochasticKValues.length; i++) {
      const recentStochasticK = stochasticKValues.slice(i - smaPeriod + 1, i + 1)
      const stochasticD = recentStochasticK.reduce((sum, value) => sum + value, 0) / smaPeriod
      result.push(stochasticD)
    }
    return result
  }

  static calculateStochasticRSI = (rsiValues: number[], period: number): number[] => {
    const kValues: number[] = []

    for (let i = period - 1; i < rsiValues.length; i++) {
      const recentRSI = rsiValues.slice(i - period + 1, i + 1)

      const lowestRSI = Math.min(...recentRSI)
      const highestRSI = Math.max(...recentRSI)

      const currentRSI = rsiValues[i]
      const stochasticRSI = ((currentRSI - lowestRSI) / (highestRSI - lowestRSI)) * 100

      kValues.push(stochasticRSI)
    }

    return kValues
  }

  static MACD = (data: number[], sortPeriod = 12, longPeriod = 26, signalPeriod: 9) => {
    const calculateMACD = (data: number[], sortPeriod: number, longPeriod: number): number[] => {
      const ema12 = this.calculateEMA(data, sortPeriod)
      const ema26 = this.calculateEMA(data, longPeriod)
      const macdLine: number[] = []

      for (let i = 0; i < data.length; i++) {
        const macdValue = ema12[i] - ema26[i]
        macdLine.push(macdValue)
      }

      return macdLine
    }

    const calculateSignal = (macdLine: number[], signalPeriod: number): number[] => {
      const signalLine = this.calculateEMA(macdLine, signalPeriod)
      return signalLine
    }

    const macd = calculateMACD(data, sortPeriod, longPeriod)

    return {
      macd,
      signal: calculateSignal(macd, signalPeriod)
    }
  }

  static MA = (data: number[]) => {
    const ma10 = this.calculateMA(data, 10)
    const ma20 = this.calculateMA(data, 20)
    const ma50 = this.calculateMA(data, 50)
    const ma100 = this.calculateMA(data, 100)
    const ma150 = this.calculateMA(data, 150)
    const ma200 = this.calculateMA(data, 200)
    return { ma10, ma20, ma50, ma100, ma150, ma200 }
  }

  static MFI = (data: number[][], period = 14) => {
    const mfi = this.calculateMFI(data, period)
    return { mfi }
  }

  static RSI = (data: number[], period = 14) => {
    const rsi = this.calculateRSI(data, period)
    return { rsi }
  }

  static STOCH = (data: number[][], period = 14) => {
    const k = this.calculateStochasticK(data.slice(100), period)
    const d = this.calculateStochasticD(k, 3)
    return { stoch: { k, d } }
  }

  static STOCH_RSI = (rsi: number[], period = 14, sma = 3) => {
    const stochRSI = this.calculateStochasticRSI(rsi.slice(100), period)
    const k = this.calculateStochasticD(stochRSI, sma)
    const d = this.calculateStochasticD(k, sma)
    return { stoch: { k, d } }
  }

  getResult = () => {
    const closeData = this.data.map((item) => item[4])
    const macd = Indicator.MACD(closeData, 12, 26, 9)
    const ma = Indicator.MA(closeData)
    const { mfi } = Indicator.MFI(this.data)
    const { rsi } = Indicator.RSI(closeData)
    const { stoch } = Indicator.STOCH(this.data)
    const { stoch: stochRSI } = Indicator.STOCH_RSI(rsi)

    return (this.result = {
      macd,
      ma,
      mfi,
      rsi,
      stoch,
      stochRSI
    })
  }
}

export default Indicator
