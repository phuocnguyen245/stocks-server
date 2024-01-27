import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const dev = {
  app: {
    PORT: process.env.DEV_PORT || 8080
  },
  db: {
    username: process.env.DEV_USERNAME,
    password: process.env.DEV_PASSWORD,
    host: process.env.DEV_HOST,
    database: process.env.DEV_DATABASE
  },
  redis: {
    username: process.env.DEV_REDIS_USERNAME,
    password: process.env.DEV_REDIS_PASSWORD,
    host: process.env.DEV_REDIS_HOST,
    port: process.env.DEV_REDIS_PORT
  }
}

const prod = {
  app: {
    PORT: process.env.PROD_PORT || 8080
  },
  db: {
    username: process.env.PROD_USERNAME,
    password: process.env.PROD_PASSWORD,
    host: process.env.PROD_HOST,
    database: process.env.PROD_DATABASE
  },
  redis: {
    username: process.env.PROD_REDIS_USERNAME,
    password: process.env.PROD_REDIS_PASSWORD,
    host: process.env.PROD_REDIS_HOST,
    port: process.env.PROD_REDIS_PORT
  }
}

const config = { dev, prod }
const env = (process.env.NODE_ENV as 'dev' | 'prod') || 'dev'
export default config[env]
