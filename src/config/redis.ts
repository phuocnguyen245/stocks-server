import { RedisClientType, createClient } from 'redis'

class RedisHandler {
  redis: RedisClientType
  constructor() {
    this.redis = createClient({
      url: 'redis://default:@localhost:6379'
    })
    this.redis.on('error', (err) => console.log('Redis Client Error', err))
    this.redis.on('connect', () => console.log('Connected to Redis'))
    this.redis.connect()
  }

  save = async (key: string, value: string) => {
    try {
      ;(await this.redis).SET(`stocks-${key}`, value)
    } catch (error) {
      throw new Error('Redis Error: ' + error)
    }
  }

  get = async (key: string) => {
    try {
      const data = (await this.redis).GET(`stocks-${key}`)
      return data
    } catch (error) {
      throw new Error('Redis Error: ' + error)
    }
  }
}

export default RedisHandler
