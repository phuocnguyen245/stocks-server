import { Request, Response, NextFunction } from 'express'

export const asyncHandler = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return fn(req, res, next).catch(next)
  }
}
