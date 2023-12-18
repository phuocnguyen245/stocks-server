import express from 'express'
import StockRouter from './stocks/index.ts'
const router = express.Router()

router.use('/stocks', StockRouter)
export default router
