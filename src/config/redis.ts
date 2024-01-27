import { RedisClientType, createClient } from 'redis'

import config from './config.ts'
import { promisify } from 'util'
const redis = (config as any)?.redis as any
console.log(redis)
const connectionString = `redis://${redis?.username}:${redis?.password}@${redis?.host}:${redis?.port}`

class RedisHandler {
  redis: RedisClientType
  constructor() {
    this.redis = createClient({
      url: connectionString
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

  removeAll = async () => {
    try {
      await this.redis.flushDb()
    } catch (error) {
      throw new Error('Redis Error: ' + error)
    }
  }

  getAllKeys = async (key: string) => {
    let cursor = 0
    let keys = []

    do {
      const res = await this.redis.scan(cursor, {
        MATCH: `stocks-${key}*`
      })
      cursor = res.cursor
      keys.push(...res.keys)
    } while (cursor !== 0)

    return keys
  }
}

export default RedisHandler
