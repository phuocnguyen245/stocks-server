import { Request, Response } from 'express';
import { RequestWithUser } from '../types/types.js';
declare class PaymentController {
    static getAll: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static create: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static update: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static remove: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
}
export default PaymentController;
