import winston from 'winston';
export declare const logger: winston.Logger;
export declare const auditLogger: winston.Logger;
export declare const httpLogger: winston.Logger;
export declare const loggerStub: {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
};
export declare const logStructured: {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, error?: any, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
    security: {
        loginAttempt: (username: string, ip: string, success: boolean, meta?: any) => void;
    };
};
export default logger;
