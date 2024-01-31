import { Request, Response, NextFunction } from 'express';
export declare const asyncHandler: (fn: any) => (req: Request, res: Response, next: NextFunction) => any;
