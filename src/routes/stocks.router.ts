import express from 'express'
import StocksController from '../controllers/stocks.controller.ts'
import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
import AuthMiddleware from '../middleware/auth.middleware.ts'
const router = express.Router()

router.get('/', AuthMiddleware.checkAuth, asyncHandler(StocksController.getAll))

router.get(
  '/statistic/:code',
  AuthMiddleware.checkAuth,
  asyncHandler(StocksController.getStatistic)
)
router.get('/watch-lists', AuthMiddleware.checkAuth, asyncHandler(StocksController.getWatchLists))
router.get(
  '/indicators/:code',
  AuthMiddleware.checkAuth,
  asyncHandler(StocksController.getIndicators)
)
router.get('/board', AuthMiddleware.checkAuth, asyncHandler(StocksController.getBoardStocks))
router.get('/recommended', AuthMiddleware.checkAuth, asyncHandler(StocksController.getRecommended))

router.post('/', AuthMiddleware.checkAuth, asyncHandler(StocksController.create))
router.patch('/:id', AuthMiddleware.checkAuth, asyncHandler(StocksController.update))
router.delete('/:id', AuthMiddleware.checkAuth, asyncHandler(StocksController.remove))

export default router
