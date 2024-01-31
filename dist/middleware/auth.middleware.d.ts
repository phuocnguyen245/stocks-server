import { NextFunction, Request, Response } from 'express';
declare class AuthMiddleware {
    static generateToken: (payload: object, key: string, expiresIn: string | number) => Promise<string>;
    static generateTokens: (payload: object, expiresAccess: string | number, expiresRefresh: string | number) => Promise<{
        access: string;
        refresh: string;
    }>;
    static verifyToken: (token: string, type: 'public' | 'secret') => Promise<{
        _id: string;
    }>;
    static checkAuth: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
}
export default AuthMiddleware;
