import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { cacheService } from '../config/database';
import { PasswordValidator, InputSanitizer } from '../config/security';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8),
  role: z.enum(['WARFIGHTER', 'INNOVATOR']).default('INNOVATOR'),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  expertise: z.array(z.string()).optional(),
  serviceBranch: z.string().max(50).optional(),
  yearsOfService: z.string().max(20).optional(),
  deploymentHistory: z.string().max(200).optional(),
  securityClearance: z.string().max(50).optional(),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Helper functions
const generateTokens = (user: any) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets not configured');
  }

  const accessTokenOptions = {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
  } as jwt.SignOptions;

  const refreshTokenOptions = {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
  } as jwt.SignOptions;

  const accessToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
    process.env.JWT_SECRET,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    refreshTokenOptions
  );

  return { accessToken, refreshToken };
};

// Register endpoint
router.post('/register', async (req, res): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Validate password strength
    const passwordValidation = PasswordValidator.validate(validatedData.password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors,
      });
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      ...validatedData,
      username: InputSanitizer.sanitizeUsername(validatedData.username),
      email: InputSanitizer.sanitizeEmail(validatedData.email),
      fullName: InputSanitizer.sanitizeHtml(validatedData.fullName),
      bio: validatedData.bio ? InputSanitizer.sanitizeHtml(validatedData.bio) : undefined,
    };

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
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

    // Hash password
    const passwordHash = await bcrypt.hash(sanitizedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...sanitizedData,
        passwordHash,
        isVerified: process.env.NODE_ENV === 'development', // Auto-verify in dev
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

    // Create user stats
    await prisma.userStats.create({
      data: { userId: user.id },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Cache user session
    await cacheService.setUserSession(user.id, {
      userId: user.id,
      username: user.username,
      role: user.role,
      lastActivity: new Date(),
    });

    // Log registration
    logStructured.security.loginAttempt(user.username, req.ip || 'unknown', true, {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    logStructured.error('Registration failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { usernameOrEmail, password } = loginSchema.parse(req.body);
    
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
        isActive: true,
      },
    });

    if (!user) {
      logStructured.security.loginAttempt(usernameOrEmail, req.ip || 'unknown', false, {
        reason: 'user_not_found',
      });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      logStructured.security.loginAttempt(user.username, req.ip || 'unknown', false, {
        reason: 'invalid_password',
        userId: user.id,
      });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login and refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken,
      },
    });

    // Cache user session
    await cacheService.setUserSession(user.id, {
      userId: user.id,
      username: user.username,
      role: user.role,
      lastActivity: new Date(),
    });

    // Log successful login
    logStructured.security.loginAttempt(user.username, req.ip || 'unknown', true, {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    logStructured.error('Login failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res): Promise<void> => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT refresh secret not configured');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;

    // Find user and verify refresh token
    const user = await prisma.user.findFirst({
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

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Update session cache
    await cacheService.setUserSession(user.id, {
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
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    logStructured.error('Token refresh failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Remove refresh token
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Remove session from cache
    await cacheService.deleteUserSession(userId);

    // Blacklist current token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      await cacheService.set(`blacklist:${token}`, true, 86400); // 24 hours
    }

    logStructured.info('User logged out', { userId, username: req.user!.username });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logStructured.error('Logout failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
  } catch (error) {
    logStructured.error('Get profile failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res): Promise<void> => {
  try {
    const updateSchema = z.object({
      fullName: z.string().min(2).max(100).optional(),
      bio: z.string().max(500).optional(),
      location: z.string().max(100).optional(),
      expertise: z.array(z.string()).optional(),
      serviceBranch: z.string().max(50).optional(),
      yearsOfService: z.string().max(20).optional(),
      deploymentHistory: z.string().max(200).optional(),
      securityClearance: z.string().max(50).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Sanitize inputs
    const sanitizedData = {
      ...validatedData,
      fullName: validatedData.fullName ? InputSanitizer.sanitizeHtml(validatedData.fullName) : undefined,
      bio: validatedData.bio ? InputSanitizer.sanitizeHtml(validatedData.bio) : undefined,
    };

    const user = await prisma.user.update({
      where: { id: req.user!.id },
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

    logStructured.info('Profile updated', { userId: req.user!.id, username: req.user!.username });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    logStructured.error('Update profile failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 