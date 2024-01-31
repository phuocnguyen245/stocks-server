import { Response } from 'express';
import { RequestWithUser } from '../types/types.js';
declare class CurrentStockController {
    static getCurrentStocks: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static removeCurrentStock: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
}
export default CurrentStockController;
