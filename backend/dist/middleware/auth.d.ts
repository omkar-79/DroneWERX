import { Request, Response, NextFunction } from 'express';
import { Permission } from '../config/security';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
                email: string;
                role: 'WARFIGHTER' | 'INNOVATOR' | 'MODERATOR' | 'ADMIN';
                isVerified: boolean;
            };
        }
    }
}
export interface AuthRequest extends Request {
    user: {
        id: string;
        username: string;
        email: string;
        role: 'WARFIGHTER' | 'INNOVATOR' | 'MODERATOR' | 'ADMIN';
        isVerified: boolean;
    };
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (permission: Permission) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVerification: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
