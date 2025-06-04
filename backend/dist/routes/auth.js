"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const database_2 = require("../config/database");
const security_1 = require("../config/security");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
    email: zod_1.z.string().email(),
    fullName: zod_1.z.string().min(2).max(100),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['WARFIGHTER', 'INNOVATOR']).default('INNOVATOR'),
    bio: zod_1.z.string().max(500).optional(),
    location: zod_1.z.string().max(100).optional(),
    expertise: zod_1.z.array(zod_1.z.string()).optional(),
    serviceBranch: zod_1.z.string().max(50).optional(),
    yearsOfService: zod_1.z.string().max(20).optional(),
    deploymentHistory: zod_1.z.string().max(200).optional(),
    securityClearance: zod_1.z.string().max(50).optional(),
});
const loginSchema = zod_1.z.object({
    usernameOrEmail: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
const generateTokens = (user) => {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT secrets not configured');
    }
    const accessTokenOptions = {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
    };
    const refreshTokenOptions = {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
    };
    const accessToken = jsonwebtoken_1.default.sign({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
    }, process.env.JWT_SECRET, accessTokenOptions);
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, refreshTokenOptions);
    return { accessToken, refreshToken };
};
router.post('/register', async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const passwordValidation = security_1.PasswordValidator.validate(validatedData.password);
        if (!passwordValidation.isValid) {
            res.status(400).json({
                error: 'Password validation failed',
                details: passwordValidation.errors,
            });
            return;
        }
        const sanitizedData = {
            ...validatedData,
            username: security_1.InputSanitizer.sanitizeUsername(validatedData.username),
            email: security_1.InputSanitizer.sanitizeEmail(validatedData.email),
            fullName: security_1.InputSanitizer.sanitizeHtml(validatedData.fullName),
            bio: validatedData.bio ? security_1.InputSanitizer.sanitizeHtml(validatedData.bio) : undefined,
        };
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username: sanitizedData.username },
                    { email: sanitizedData.email },
                ],
            },
        });
        if (existingUser) {
            res.status(409).json({
                error: 'User already exists',
                field: existingUser.username === sanitizedData.username ? 'username' : 'email',
            });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(sanitizedData.password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                ...sanitizedData,
                passwordHash,
                isVerified: process.env.NODE_ENV === 'development',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sanitizedData.username}`,
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true,
                avatar: true,
                bio: true,
                location: true,
                expertise: true,
                serviceBranch: true,
                yearsOfService: true,
                deploymentHistory: true,
                securityClearance: true,
                joinDate: true,
            },
        });
        await database_1.prisma.userStats.create({
            data: { userId: user.id },
        });
        const { accessToken, refreshToken } = generateTokens(user);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        await database_2.cacheService.setUserSession(user.id, {
            userId: user.id,
            username: user.username,
            role: user.role,
            lastActivity: new Date(),
        });
        logger_1.logStructured.security.loginAttempt(user.username, req.ip || 'unknown', true, {
            action: 'register',
            userId: user.id,
        });
        res.status(201).json({
            message: 'User registered successfully',
            user,
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: '15m',
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        logger_1.logStructured.error('Registration failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = loginSchema.parse(req.body);
        const user = await database_1.prisma.user.findFirst({
            where: {
                OR: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail },
                ],
                isActive: true,
            },
        });
        if (!user) {
            logger_1.logStructured.security.loginAttempt(usernameOrEmail, req.ip || 'unknown', false, {
                reason: 'user_not_found',
            });
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            logger_1.logStructured.security.loginAttempt(user.username, req.ip || 'unknown', false, {
                reason: 'invalid_password',
                userId: user.id,
            });
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const { accessToken, refreshToken } = generateTokens(user);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                refreshToken,
            },
        });
        await database_2.cacheService.setUserSession(user.id, {
            userId: user.id,
            username: user.username,
            role: user.role,
            lastActivity: new Date(),
        });
        logger_1.logStructured.security.loginAttempt(user.username, req.ip || 'unknown', true, {
            userId: user.id,
        });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isVerified: user.isVerified,
                avatar: user.avatar,
                bio: user.bio,
                location: user.location,
                expertise: user.expertise,
                serviceBranch: user.serviceBranch,
                yearsOfService: user.yearsOfService,
                deploymentHistory: user.deploymentHistory,
                securityClearance: user.securityClearance,
                joinDate: user.joinDate,
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: '15m',
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        logger_1.logStructured.error('Login failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = refreshTokenSchema.parse(req.body);
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT refresh secret not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await database_1.prisma.user.findFirst({
            where: {
                id: decoded.userId,
                refreshToken,
                isActive: true,
            },
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        const tokens = generateTokens(user);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken },
        });
        await database_2.cacheService.setUserSession(user.id, {
            userId: user.id,
            username: user.username,
            role: user.role,
            lastActivity: new Date(),
        });
        res.json({
            message: 'Token refreshed successfully',
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: '15m',
            },
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        logger_1.logStructured.error('Token refresh failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        await database_2.cacheService.deleteUserSession(userId);
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            await database_2.cacheService.set(`blacklist:${token}`, true, 86400);
        }
        logger_1.logStructured.info('User logged out', { userId, username: req.user.username });
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        logger_1.logStructured.error('Logout failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true,
                avatar: true,
                bio: true,
                location: true,
                expertise: true,
                serviceBranch: true,
                yearsOfService: true,
                deploymentHistory: true,
                securityClearance: true,
                joinDate: true,
                lastLoginAt: true,
                stats: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        logger_1.logStructured.error('Get profile failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const updateSchema = zod_1.z.object({
            fullName: zod_1.z.string().min(2).max(100).optional(),
            bio: zod_1.z.string().max(500).optional(),
            location: zod_1.z.string().max(100).optional(),
            expertise: zod_1.z.array(zod_1.z.string()).optional(),
            serviceBranch: zod_1.z.string().max(50).optional(),
            yearsOfService: zod_1.z.string().max(20).optional(),
            deploymentHistory: zod_1.z.string().max(200).optional(),
            securityClearance: zod_1.z.string().max(50).optional(),
        });
        const validatedData = updateSchema.parse(req.body);
        const sanitizedData = {
            ...validatedData,
            fullName: validatedData.fullName ? security_1.InputSanitizer.sanitizeHtml(validatedData.fullName) : undefined,
            bio: validatedData.bio ? security_1.InputSanitizer.sanitizeHtml(validatedData.bio) : undefined,
        };
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: sanitizedData,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true,
                avatar: true,
                bio: true,
                location: true,
                expertise: true,
                serviceBranch: true,
                yearsOfService: true,
                deploymentHistory: true,
                securityClearance: true,
                joinDate: true,
                lastLoginAt: true,
            },
        });
        logger_1.logStructured.info('Profile updated', { userId: req.user.id, username: req.user.username });
        res.json({
            message: 'Profile updated successfully',
            user,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        logger_1.logStructured.error('Update profile failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map