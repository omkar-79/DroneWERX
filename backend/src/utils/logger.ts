import winston from 'winston';
import path from 'path';

// Define log levels
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

winston.addColors(logColors);

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
  })
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: {
    service: 'dronewerx-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Audit log for security events
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'audit.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: logFormat,
    }),
  ],
  exitOnError: false,
});

// Security audit logger
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'dronewerx-audit',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'security-audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 20, // Keep more audit logs
      tailable: true,
    }),
  ],
});

// HTTP request logger
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'dronewerx-http',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Simple logger stub for development
export const loggerStub = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta || ''),
};

export const logStructured = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message: string, error?: any, meta?: any) => {
    console.error(`[ERROR] ${message}`, error || '', meta || '');
  },
  debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta || ''),
  
  security: {
    loginAttempt: (username: string, ip: string, success: boolean, meta?: any) => {
      console.log(`[SECURITY] Login attempt: ${username} from ${ip} - ${success ? 'SUCCESS' : 'FAILED'}`, meta || '');
    },
  },
};

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger; 