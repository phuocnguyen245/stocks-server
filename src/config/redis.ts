import { RedisClientType, createClient } from 'redis'

class RedisHandler {
  redis: RedisClientType
  constructor() {
    this.redis = createClient({
      url: 'redis://default:VdCWmrbVOUyVld5wjLrVBA2jMJ9oCq5C@redis-14062.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:14062'
    })
    this.redis.on('error', (err) => {
      console.log('Redis Client Error', err)
      this.redis.disconnect()
      throw new Error(err)
    })
    this.redis.on('connect', () => console.log('Connected to Redis'))
    this.redis.connect()
  }

  save = async (key: string, value: unknown) => {
    try {
      return await this.redis.SET(`stocks-${key}`, JSON.stringify(value))
    } catch (error) {
      throw new Error('Redis Error: ' + error)
    }
  }

  get = async (key: string) => {
    try {
      const data = await this.redis.GET(`stocks-${key}`)
      if (data) {
        const parseData = await JSON.parse(data)
        return parseData
      }
      return null
    } catch (error) {
      throw new Error('Redis Error: ' + error)
    }
  }

  setExpired = async (key: string, expired: number) => {
    try {
      await this.redis.expire(`stocks-${key}`, expired)
    } catch (error) {
      throw new Error('Redis Error: ' + error)
    }
  }
}

export default RedisHandler
