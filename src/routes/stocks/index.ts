import express from 'express'
import StocksController from '../../controllers/stocks.controller.ts'
import { asyncHandler } from '../../utils/helpers/asyncHandler.ts'
const router = express.Router()

router.get('/', asyncHandler(StocksController.getAll))

router.get('/statistic/:code', asyncHandler(StocksController.getStatistic))

router.post('/', asyncHandler(StocksController.create))
router.patch('/:id', asyncHandler(StocksController.update))
router.delete('/:id', asyncHandler(StocksController.remove))

export default router
