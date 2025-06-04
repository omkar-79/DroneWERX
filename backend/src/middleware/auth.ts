import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Permission, hasPermission } from '../config/security';
import { cacheService } from '../config/database';

// Extend the Express Request interface directly
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

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Check if token is blacklisted (Redis)
    const isBlacklisted = await cacheService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as any;

    // Check if user session exists in cache
    const sessionData = await cacheService.getUserSession(decoded.userId);
    if (!sessionData) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient role permissions',
        required: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireVerification = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({ error: 'Email verification required' });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await cacheService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as any;
    const sessionData = await cacheService.getUserSession(decoded.userId);
    
    if (sessionData) {
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        isVerified: decoded.isVerified,
      };
    }

    next();
  } catch (error) {
    // Silently continue without authentication for optional auth
    next();
  }
};