import express from 'express'
import StockRouter from './stocks/index.ts'
import PaymentRouter from './payment.router.ts'
import CurrentStockRouter from './currentStocks/index.ts'
const router = express.Router()

router.use('/stocks', StockRouter)
router.use('/current-stocks', CurrentStockRouter)
router.use('/payment', PaymentRouter)
export default router
