import express from 'express'

import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
import PaymentController from '../controllers/payment.controller.ts'
const router = express.Router()

router.get('/', asyncHandler(PaymentController.getAll))
router.get('/:id', asyncHandler(PaymentController.getById))
router.post('/', asyncHandler(PaymentController.create))
router.patch('/:id', asyncHandler(PaymentController.update))
router.delete('/:id', asyncHandler(PaymentController.remove))

export default router
