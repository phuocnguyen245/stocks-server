import express from 'express'
import AssetController from '../controllers/asset.controller.ts'
import { asyncHandler } from '../utils/helpers/asyncHandler.ts'
const router = express.Router()

router.get('/', asyncHandler(AssetController.getAsset))

export default router
