import { BadRequest, NotFound } from '../core/error.response.ts'
import { CREATED, DELETED, OK, UPDATED } from '../core/success.response.ts'
import UserService from '../services/v1Mongoose/user.service.ts'
import { Request, Response } from 'express'
import { RequestWithUser } from '../types/types.js'
import AuthMiddleware from '../middleware/auth.middleware.ts'

const message = {
  CREATED: 'Successfully created',
  DELETED: 'Deleted successfully',
  LOGIN: 'Login successfully',
  INVALID_ID: 'ID is required'
}

class UserController {
  static getAllUsers = async (req: Request, res: Response) => {
    const users = await UserService.getAll()
    return new OK({ data: users }).send(res)
  }

  static getUser = async (req: Request, res: Response) => {
    const { id } = req.params
    const user = await UserService.getByIdOrUsername(id)
    return new OK({ data: user }).send(res)
  }

  static login = async (req: Request, res: Response) => {
    const user = await UserService.login(req.body)
    return new OK({ data: user, message: message.LOGIN }).send(res)
  }

  static register = async (req: Request, res: Response) => {
    const user = await UserService.register(req.body)
    return new CREATED({ data: user, message: message.CREATED }).send(res)
  }

  static remove = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) {
      throw new BadRequest(message.INVALID_ID)
    }
    await UserService.remove(id)
    return new DELETED({ message: message.DELETED }).send(res)
  }

  static generateTokensByRefreshToken = async (req: RequestWithUser, res: Response) => {
    const id = req.id
    const tokens = await AuthMiddleware.generateTokens({ _id: id }, '2h', '7d')
    return new OK({ data: tokens }).send(res)
  }

  static updatePassword = async (req: RequestWithUser, res: Response) => {
    const token = req.body.token
    const verifyToken = await AuthMiddleware.verifyToken(token, 'secret')
    const password = req.body.password
    if (!verifyToken) {
      throw new BadRequest('Error token, please try again')
    }
    await UserService.updatePassword(verifyToken._id, password)
    return new UPDATED({ message: 'Password has been updated' }).send(res)
  }

  static sendMail = async (req: RequestWithUser, res: Response) => {
    const email = req.body.email

    await UserService.sendMail(email)
    return new OK({ message: 'Email already sent' }).send(res)
  }
}

export default UserController
