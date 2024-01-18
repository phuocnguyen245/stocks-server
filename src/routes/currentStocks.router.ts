import express from 'express'
import CurrentStockController from '../controllers/currentStocks.controller.ts'
import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
import AuthMiddleware from '../middleware/auth.middleware.ts'
const router = express.Router()

router.get('/', AuthMiddleware.checkAuth, asyncHandler(CurrentStockController.getCurrentStocks))
router.delete(
  '/:code',
  AuthMiddleware.checkAuth,
  asyncHandler(CurrentStockController.removeCurrentStock)
)

export default router
