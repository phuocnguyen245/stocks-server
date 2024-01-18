import express from 'express'

import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
import PaymentController from '../controllers/payment.controller.ts'
import AuthMiddleware from '../middleware/auth.middleware.ts'
const router = express.Router()

router.get('/', AuthMiddleware.checkAuth, asyncHandler(PaymentController.getAll))
router.get('/:id', AuthMiddleware.checkAuth, asyncHandler(PaymentController.getById))
router.post('/', AuthMiddleware.checkAuth, asyncHandler(PaymentController.create))
router.patch('/:id', AuthMiddleware.checkAuth, asyncHandler(PaymentController.update))
router.delete('/:id', AuthMiddleware.checkAuth, asyncHandler(PaymentController.remove))

export default router
