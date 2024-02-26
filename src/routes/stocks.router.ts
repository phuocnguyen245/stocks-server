import express from 'express'
import StocksController from '../controllers/stocks.controller.ts'
import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
import AuthMiddleware from '../middleware/auth.middleware.ts'
import WatchListController from '../controllers/watchlist.controller.ts'
const router = express.Router()

router.get('/', AuthMiddleware.checkAuth, asyncHandler(StocksController.getAll))

router.get(
  '/statistic/:code',
  AuthMiddleware.checkAuth,
  asyncHandler(StocksController.getStatistic)
)
router.get(
  '/indicators/:code',
  AuthMiddleware.checkAuth,
  asyncHandler(StocksController.getIndicators)
)
router.get('/board', AuthMiddleware.checkAuth, asyncHandler(StocksController.getBoardStocks))
router.get('/recommended', AuthMiddleware.checkAuth, asyncHandler(StocksController.getRecommended))

router.get('/refresh', AuthMiddleware.checkAuth, asyncHandler(StocksController.getRefreshTime))
router.post('/refresh', AuthMiddleware.checkAuth, asyncHandler(StocksController.refreshTime))

router.post('/', AuthMiddleware.checkAuth, asyncHandler(StocksController.create))
router.patch('/:id', AuthMiddleware.checkAuth, asyncHandler(StocksController.update))
router.delete('/:id', AuthMiddleware.checkAuth, asyncHandler(StocksController.remove))

router.get('/watch-lists', AuthMiddleware.checkAuth, asyncHandler(StocksController.getWatchLists))
router.post(
  '/watch-lists',
  AuthMiddleware.checkAuth,
  asyncHandler(WatchListController.createOrUpdateWatchList)
)

export default router
