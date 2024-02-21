import { Types } from 'mongoose'
import { Users } from '../models/user.model.ts'
import { User } from '../types/types.js'
import { BadRequest, NotFound } from '../core/error.response.ts'
import { createHash } from 'node:crypto'
import AuthMiddleware from '../middleware/auth.middleware.ts'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  secure: true,
  service: 'gmail',
  auth: {
    user: 'phuocnguyen24598@gmail.com',
    pass: 'iuve iwdb qcoj lcdh'
  }
})

const message = {
  EXISTED: 'User already exists',
  NOT_FOUND: 'User not found',
  NOT_FOUND_EMAIL: 'Email not found'
}

class UserService {
  static verifyPassword = (inputPassword: string, storedPasswordHash: string) => {
    const hash = createHash('sha256')
    hash.update(inputPassword)
    const hashedInputPassword = hash.digest('hex')
    return hashedInputPassword === storedPasswordHash
  }

  static hashPassword = (password: string) => {
    const hash = createHash('sha256')
    hash.update(password)
    return hash.digest('hex')
  }

  static getAll = async () => {
    return await Users.find({ isDeleted: false }).lean()
  }

  static getByIdOrUsername = async (payload: string) => {
    const isObjectId = Types.ObjectId.isValid(payload)
    const query = isObjectId ? { _id: payload } : { username: payload }
    const foundUser = await Users.findOne({ ...query, isDeleted: false }).lean()

    if (!foundUser) {
      return null
    }

    return foundUser
  }

  static remove = async (id: string) => {
    await Users.findByIdAndUpdate(new Types.ObjectId(id), { isDeleted: true }, { new: true }).lean()
  }

  static create = async (body: User) => {
    return (await Users.create(body)).toObject()
  }

  static register = async (body: User) => {
    const foundUser = await this.getByIdOrUsername(body.username)

    if (foundUser) {
      throw new BadRequest(message.EXISTED)
    }

    const password = this.hashPassword(body.password)
    const newUser = await this.create({ ...body, password })

    return {
      ...newUser,
      tokens: {
        ...(await AuthMiddleware.generateTokens({ _id: newUser._id }, '2h', '7d'))
      }
    }
  }

  static login = async ({ username, password }: { username: string; password: string }) => {
    const foundUser = await this.getByIdOrUsername(username)
    if (!foundUser) {
      throw new NotFound(message.NOT_FOUND)
    }

    if (!this.verifyPassword(password, foundUser.password)) {
      throw new NotFound(message.NOT_FOUND)
    }

    return {
      ...foundUser,
      tokens: {
        ...(await AuthMiddleware.generateTokens({ _id: foundUser._id }, '2h', '72h'))
      }
    }
  }

  static updatePassword = async (id: string, password: string) => {
    const newPassword = await this.hashPassword(password)
    await Users.findByIdAndUpdate(id, { password: newPassword })
  }

  static sendMail = async (email: string) => {
    const foundUser = await Users.findOne({ email }).lean()
    if (!foundUser) {
      throw new NotFound(message.NOT_FOUND_EMAIL)
    }
    const token = await AuthMiddleware.generateToken(
      { _id: foundUser._id },
      process.env.PRIVATE_KEY as string,
      '1h'
    )
    await transporter.sendMail({
      from: 'phuocnguyen24598@gmail.com',
      to: foundUser.email,
      subject: 'Reset Password (Stock Tracking) ✔',
      text: 'Follow step to get new password',
      html: `<b>Please click on</b> https://stocks-tracking.netlify.app/forgot-password?token=${token} to get new password`
    })
  }
}
export default UserService
