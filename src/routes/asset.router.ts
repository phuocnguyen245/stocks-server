import express from 'express'
import AssetController from '../controllers/asset.controller.ts'
import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
import AuthMiddleware from '../middleware/auth.middleware.ts'
const router = express.Router()

router.get('/', AuthMiddleware.checkAuth, asyncHandler(AssetController.getAsset))

export default router
