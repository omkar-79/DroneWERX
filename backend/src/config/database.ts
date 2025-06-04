import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Prisma Client with logging and error handling
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  errorFormat: 'pretty',
});

// Prisma logging
prisma.$on('query', (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: e.duration + 'ms',
    });
  }
});

prisma.$on('error', (e: any) => {
  logger.error('Prisma error:', e);
});

// Redis Client with error handling
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Database connection functions
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database health check passed');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    await redis.quit();
    logger.info('Database and Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

// Redis helper functions
export const cacheService = {
  async get(key: string) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: any, expireInSeconds: number = 3600) {
    try {
      await redis.setex(key, expireInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  async del(key: string) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  async exists(key: string) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },

  async increment(key: string, expireInSeconds: number = 3600) {
    try {
      const value = await redis.incr(key);
      if (value === 1) {
        await redis.expire(key, expireInSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return 0;
    }
  },

  async getUserSession(userId: string) {
    return await this.get(`user:${userId}:session`);
  },

  async setUserSession(userId: string, sessionData: any, expireInSeconds: number = 86400) {
    return await this.set(`user:${userId}:session`, sessionData, expireInSeconds);
  },

  async deleteUserSession(userId: string) {
    return await this.del(`user:${userId}:session`);
  },

  async cacheThreads(key: string, threads: any[], expireInSeconds: number = 600) {
    return await this.set(`threads:${key}`, threads, expireInSeconds);
  },

  async getCachedThreads(key: string) {
    return await this.get(`threads:${key}`);
  }
};

// Health check function
export const healthCheck = async () => {
  const health = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
  }

  try {
    await redis.ping();
    health.redis = true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }

  return health;
}; 