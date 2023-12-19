import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import { default as helmet } from 'helmet'
import morgan from 'morgan'
import { instanceMongodb } from './config/database.ts'
import router from './routes/index.ts'
const app = express()
instanceMongodb

//init middleware
app.use(cors())
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
dotenv.config()

//router
app.use('/api/v1', router)

//handle error
app.use((req, res, next) => {
  const error = new Error('Not found')
  ;(error as any).statusCode = 404
  next(error)
})

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || '500'
  return res.status(statusCode).json({
    status: 'Error',
    code: statusCode,
    ...(error.subMessage && { subMessage: error.subMessage }),
    message: error.message || 'Internal Server Error'
  })
})

export default app
