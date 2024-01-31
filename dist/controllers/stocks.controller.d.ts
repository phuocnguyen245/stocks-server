import { NextFunction, Request, Response } from 'express';
import { BadRequest } from '../core/error.response.ts';
import { RequestWithUser, Stock } from '../types/types.js';
declare class StocksController {
    static formatBody: (body: Stock, currentStock?: Stock) => Stock;
    static getAll: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getById: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>> | BadRequest>;
    static create: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static update: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static remove: (req: RequestWithUser, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    static getStatistic: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getWatchLists: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getIndicators: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getBoardStocks: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getRecommended: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static refreshTime: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getRefreshTime: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
}
export default StocksController;
