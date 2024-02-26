import { RedisClientType, createClient } from 'redis'

import config from './config.ts'
const redis = (config as any)?.redis as any
const connectionString = `redis://${redis?.username}:${redis?.password}@${redis?.host}:${redis?.port}`
console.log(redis, process.env.NODE_ENV)

class RedisHandler {
  redis: RedisClientType
  constructor() {
    this.redis = createClient({
      url: connectionString,
      legacyMode: false
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
      if (typeof value === 'string') {
        return await this.redis.SET(`stocks-${key}`, value)
      }
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

  removeKey = async (key: string) => {
    try {
      await this.redis.del(`stocks-${key}`)
    } catch (error) {
      throw new Error('Redis Error:' + error)
    }
  }

  removeKeys = async (key: string): Promise<void> => {
    const keys = await this.getAllKeys(key)
    if (keys.length) {
      await Promise.all(keys.map((item) => this.redis.del(item)))
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
