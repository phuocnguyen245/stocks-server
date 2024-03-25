import { Response } from 'express'
import { OK } from '../core/success.response.ts'
import AssetsService from '../services/v1Mongoose/assets.service.ts'
import { RequestWithUser } from '../types/types.js'

class AssetController {
  static getAsset = async (req: RequestWithUser, res: Response) => {
    const { id: userId } = req
    const data = await AssetsService.getAsset(userId)
    return new OK({
      data
    }).send(res)
  }
}

export default AssetController
