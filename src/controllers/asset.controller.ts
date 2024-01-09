import { Request, Response } from 'express'
import AssetsService from '../services/assets.service.ts'
import { OK } from '../core/success.response.ts'

class AssetController {
  static getAsset = async (req: Request, res: Response) => {
    const data = await AssetsService.getAsset()
    return new OK({
      data: {
        ...data
      }
    }).send(res)
  }
}

export default AssetController
