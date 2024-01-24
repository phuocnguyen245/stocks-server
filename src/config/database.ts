import mongoose from 'mongoose'
import config from './config.ts'
const db = config?.db as any
const connectionString = `mongodb+srv://${db?.username}:${db?.password}@${db?.host}/${db?.database}?retryWrites=true&w=majority`

class MongoDatabase {
  private static instance: MongoDatabase | null = null

  private constructor() {
    this.connect()
  }

  private connect(type = 'mongodb') {
    if (1 === 1) {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }
    mongoose
      .connect(connectionString, {
        maxPoolSize: 50
      })
      .then(() => {
        console.log('Connected to mongo database')
      })
      .catch((error) => {
        console.log('Error connecting to mongo database')
      })
  }

  static getInstance() {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase()
    }
    return MongoDatabase.instance
  }
}
export const instanceMongodb = MongoDatabase.getInstance()
