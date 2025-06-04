"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireVerification = exports.requireRole = exports.requirePermission = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const security_1 = require("../config/security");
const database_1 = require("../config/database");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const isBlacklisted = await database_1.cacheService.exists(`blacklist:${token}`);
        if (isBlacklisted) {
            res.status(401).json({ error: 'Token has been revoked' });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const sessionData = await database_1.cacheService.getUserSession(decoded.userId);
        if (!sessionData) {
            res.status(401).json({ error: 'Session expired' });
            return;
        }
        req.user = {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            isVerified: decoded.isVerified,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
        }
        else {
            console.error('Auth middleware error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
exports.authenticateToken = authenticateToken;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!(0, security_1.hasPermission)(req.user.role, permission)) {
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
exports.requirePermission = requirePermission;
const requireRole = (roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
const requireVerification = (req, res, next) => {
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
exports.requireVerification = requireVerification;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        const isBlacklisted = await database_1.cacheService.exists(`blacklist:${token}`);
        if (isBlacklisted) {
            next();
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const sessionData = await database_1.cacheService.getUserSession(decoded.userId);
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
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map