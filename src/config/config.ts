const dev = {
  app: {
    PORT: process.env.DEV_PORT || 8080,
  },
  db: {
    username: process.env.DEV_USERNAME || 'root',
    password: process.env.DEV_PASSWORD || 'root',
    host: process.env.DEV_HOST || 'cluster0.iq84qw3.mongodb.net',
    database: process.env.DEV_DATABASE || 'stocks',
  },
}

const prod = {
  app: {
    PORT: process.env.PROD_PORT || 8080,
  },
  db: {
    username: process.env.PROD_USERNAME || 'root',
    password: process.env.PROD_PASSWORD || 'admin',
    host: process.env.PROD_HOST || 'localhost',
    database: process.env.PROD_DATABASE || 'ecommerce',
  },
}

const config = { dev, prod }
const env = (process.env.NODE_ENV as 'dev' | 'prod') || 'dev'
export default config[env]
