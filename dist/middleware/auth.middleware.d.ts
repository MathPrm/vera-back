import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    userId?: number;
    userEmail?: string;
    is_admin?: boolean;
}
export declare const verifyToken: (req: AuthRequest, res: Response, next: NextFunction) => Response | void;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map