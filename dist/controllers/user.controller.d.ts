import { Request, Response } from 'express';
import { RequestWithUser } from '../types/types.js';
declare class UserController {
    static getAllUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static getUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static remove: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    static generateTokensByRefreshToken: (req: RequestWithUser, res: Response) => Promise<Response<any, Record<string, any>>>;
}
export default UserController;
