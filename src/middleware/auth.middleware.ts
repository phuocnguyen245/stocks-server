import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const message = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  MISSING_TOKEN: 'MISSING_TOKEN'
}

class AuthMiddleware {
  static generateToken = async (payload: object, key: string, expiresIn: string | number) => {
    return await jwt.sign(payload, key, { expiresIn })
  }

  static generateTokens = async (
    payload: object,
    expiresAccess: string | number,
    expiresRefresh: string | number
  ) => {
    const tokenType = {
      public: process.env.PUBLIC_KEY as string,
      secret: process.env.PRIVATE_KEY as string
    }

    const access = await this.generateToken(payload, tokenType.public, expiresAccess)
    const refresh = await this.generateToken(payload, tokenType.secret, expiresRefresh)
    return { access, refresh }
  }

  static verifyToken = async (token: string, type: 'public' | 'secret') => {
    const tokenType = {
      public: process.env.PUBLIC_KEY as string,
      secret: process.env.PRIVATE_KEY as string
    }
    const secretOrPrivateKey = tokenType[type] || tokenType.public
    return (await jwt.verify(token, secretOrPrivateKey)) as Promise<{ _id: string }>
  }

  static checkAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body.refreshToken)

      const header = req?.header('Authorization')
      if (!header) {
        throw Error(message.MISSING_TOKEN)
      }
      const token = header.split(' ')[1]
      const { _id } = await this.verifyToken(token, 'public')

      const obj: any = { ...req, id: _id }
      req = obj
      return next()
    } catch (error: any) {
      try {
        const refreshToken = req.body?.refreshToken
        if (refreshToken) {
          const { _id } = await this.verifyToken(refreshToken, 'secret')
          const obj: any = { ...req, id: _id }
          req = obj
          return next()
        }
        return res.status(401).json({ message: error?.message, subMessage: message.MISSING_TOKEN })
      } catch (error: any) {
        return res.status(401).json({ message: error?.message, subMessage: message.MISSING_TOKEN })
      }
    }
  }
}
export default AuthMiddleware
