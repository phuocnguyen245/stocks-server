import express from 'express'
import UserController from '../controllers/user.controller.ts'
import AuthMiddleware from '../middleware/auth.middleware.ts'
import { asyncHandler } from '../utils/helpers/asyncHandler.ts'

const router = express.Router()

router.get('/', asyncHandler(UserController.getAllUsers))
router.get('/:id', asyncHandler(AuthMiddleware.checkAuth), asyncHandler(UserController.getUser))
router.post('/login', asyncHandler(UserController.login))
router.post(
  '/refresh-token',
  AuthMiddleware.checkAuth,
  asyncHandler(UserController.generateTokensByRefreshToken)
)
router.post('/register', asyncHandler(UserController.register))
router.post('/send-mail', asyncHandler(UserController.sendMail))
router.put('/password', asyncHandler(UserController.updatePassword))
router.delete('/:id', asyncHandler(UserController.remove))

export default router
