import JWT from 'jsonwebtoken';
export declare const verifyToken: (key: string, secretKey: string) => Promise<string | JWT.JwtPayload>;
