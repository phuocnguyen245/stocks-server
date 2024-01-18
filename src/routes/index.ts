import express from 'express'
import StockRouter from './stocks.router.ts'
import PaymentRouter from './payment.router.ts'
import CurrentStockRouter from './currentStocks.router.ts'
import AssetRouter from './asset.router.ts'
import UserRouter from './users.router.ts'
const router = express.Router()

router.use('/stocks', StockRouter)
router.use('/current-stocks', CurrentStockRouter)
router.use('/payment', PaymentRouter)
router.use('/asset', AssetRouter)
router.use('/users', UserRouter)

export default router
