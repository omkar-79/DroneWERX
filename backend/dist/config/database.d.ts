import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
export declare const prisma: PrismaClient<{
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "event";
        level: "info";
    } | {
        emit: "event";
        level: "warn";
    })[];
    errorFormat: "pretty";
}, "error" | "warn" | "info" | "query", import("@prisma/client/runtime/library").DefaultArgs>;
export declare const redis: Redis;
export declare const connectDatabase: () => Promise<void>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const cacheService: {
    get(key: string): Promise<any>;
    set(key: string, value: any, expireInSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    increment(key: string, expireInSeconds?: number): Promise<number>;
    getUserSession(userId: string): Promise<any>;
    setUserSession(userId: string, sessionData: any, expireInSeconds?: number): Promise<boolean>;
    deleteUserSession(userId: string): Promise<boolean>;
    cacheThreads(key: string, threads: any[], expireInSeconds?: number): Promise<boolean>;
    getCachedThreads(key: string): Promise<any>;
};
export declare const healthCheck: () => Promise<{
    database: boolean;
    redis: boolean;
    timestamp: string;
}>;
