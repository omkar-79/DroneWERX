"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStructured = exports.loggerStub = exports.httpLogger = exports.auditLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(logColors);
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
}));
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
}));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    defaultMeta: {
        service: 'dronewerx-backend',
        environment: process.env.NODE_ENV || 'development',
    },
    transports: [
        new winston_1.default.transports.Console({
            format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'app.log'),
            format: logFormat,
            maxsize: 10485760,
            maxFiles: 5,
            tailable: true,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 10485760,
            maxFiles: 5,
            tailable: true,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'audit.log'),
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
            maxsize: 10485760,
            maxFiles: 10,
            tailable: true,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'exceptions.log'),
            format: logFormat,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'rejections.log'),
            format: logFormat,
        }),
    ],
    exitOnError: false,
});
exports.auditLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: {
        service: 'dronewerx-audit',
        environment: process.env.NODE_ENV || 'development',
    },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'security-audit.log'),
            maxsize: 10485760,
            maxFiles: 20,
            tailable: true,
        }),
    ],
});
exports.httpLogger = winston_1.default.createLogger({
    level: 'http',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: {
        service: 'dronewerx-http',
    },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'http.log'),
            maxsize: 10485760,
            maxFiles: 5,
            tailable: true,
        }),
    ],
});
exports.loggerStub = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    debug: (message, meta) => console.log(`[DEBUG] ${message}`, meta || ''),
};
exports.logStructured = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message, error, meta) => {
        console.error(`[ERROR] ${message}`, error || '', meta || '');
    },
    debug: (message, meta) => console.log(`[DEBUG] ${message}`, meta || ''),
    security: {
        loginAttempt: (username, ip, success, meta) => {
            console.log(`[SECURITY] Login attempt: ${username} from ${ip} - ${success ? 'SUCCESS' : 'FAILED'}`, meta || '');
        },
    },
};
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map