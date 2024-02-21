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
router.get('/api-confirmation', (req, res) => {
  res.json({
    status: 200,
    success: true,
    message:
      'Confirmation Successfully - Close the page and continue using the stock-tracking webapp.',
    redirectUrl: 'https://stocks-tracking.netlify.app/login'
  })
})

export default router
