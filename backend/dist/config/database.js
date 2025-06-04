"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.cacheService = exports.disconnectDatabase = exports.connectDatabase = exports.redis = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
exports.prisma = new client_1.PrismaClient({
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
exports.prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        logger_1.logger.debug('Query:', {
            query: e.query,
            params: e.params,
            duration: e.duration + 'ms',
        });
    }
});
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma error:', e);
});
exports.redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
});
exports.redis.on('connect', () => {
    logger_1.logger.info('Redis connected successfully');
});
exports.redis.on('error', (error) => {
    logger_1.logger.error('Redis connection error:', error);
});
exports.redis.on('ready', () => {
    logger_1.logger.info('Redis client ready');
});
exports.redis.on('reconnecting', () => {
    logger_1.logger.warn('Redis reconnecting...');
});
exports.redis.on('close', () => {
    logger_1.logger.warn('Redis connection closed');
});
const connectDatabase = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        await exports.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('Database health check passed');
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await exports.prisma.$disconnect();
        await exports.redis.quit();
        logger_1.logger.info('Database and Redis disconnected');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from database:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
exports.cacheService = {
    async get(key) {
        try {
            const value = await exports.redis.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error('Redis GET error:', error);
            return null;
        }
    },
    async set(key, value, expireInSeconds = 3600) {
        try {
            await exports.redis.setex(key, expireInSeconds, JSON.stringify(value));
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis SET error:', error);
            return false;
        }
    },
    async del(key) {
        try {
            await exports.redis.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis DEL error:', error);
            return false;
        }
    },
    async exists(key) {
        try {
            const result = await exports.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXISTS error:', error);
            return false;
        }
    },
    async increment(key, expireInSeconds = 3600) {
        try {
            const value = await exports.redis.incr(key);
            if (value === 1) {
                await exports.redis.expire(key, expireInSeconds);
            }
            return value;
        }
        catch (error) {
            logger_1.logger.error('Redis INCR error:', error);
            return 0;
        }
    },
    async getUserSession(userId) {
        return await this.get(`user:${userId}:session`);
    },
    async setUserSession(userId, sessionData, expireInSeconds = 86400) {
        return await this.set(`user:${userId}:session`, sessionData, expireInSeconds);
    },
    async deleteUserSession(userId) {
        return await this.del(`user:${userId}:session`);
    },
    async cacheThreads(key, threads, expireInSeconds = 600) {
        return await this.set(`threads:${key}`, threads, expireInSeconds);
    },
    async getCachedThreads(key) {
        return await this.get(`threads:${key}`);
    }
};
const healthCheck = async () => {
    const health = {
        database: false,
        redis: false,
        timestamp: new Date().toISOString(),
    };
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        health.database = true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
    }
    try {
        await exports.redis.ping();
        health.redis = true;
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed:', error);
    }
    return health;
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=database.js.map