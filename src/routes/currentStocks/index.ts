import express from 'express'
import CurrentStockController from '../../controllers/currentStocks.controller.ts'
import { asyncHandler } from '../../utils/helpers/asyncHandler.ts'
const router = express.Router()

router.get('/', asyncHandler(CurrentStockController.getCurrentStocks))
router.delete('/:code', asyncHandler(CurrentStockController.removeCurrentStock))

export default router
