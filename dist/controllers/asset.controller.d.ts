import { Response } from 'express';
import { RequestWithUser } from '../types/types.js';
declare class AssetController {
    static getAsset: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
}
export default AssetController;
