"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityHeaders = exports.hasPermission = exports.ROLE_PERMISSIONS = exports.Permission = exports.InputSanitizer = exports.PasswordValidator = exports.EncryptionService = exports.SECURITY_CONFIG = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
exports.SECURITY_CONFIG = {
    JWT: {
        ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
        REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
        ALGORITHM: 'RS256',
        ISSUER: 'dronewerx-backend',
        AUDIENCE: 'dronewerx-app',
    },
    ENCRYPTION: {
        ALGORITHM: 'AES',
        KEY_SIZE: 256,
        IV_SIZE: 16,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SYMBOLS: true,
        SALT_ROUNDS: 12,
    },
    RATE_LIMITING: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        SKIP_SUCCESSFUL_REQUESTS: false,
        SKIP_FAILED_REQUESTS: false,
    },
    SESSION: {
        MAX_SESSIONS_PER_USER: 5,
        CLEANUP_INTERVAL: 1000 * 60 * 60,
    },
    FILE_UPLOAD: {
        MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800'),
        ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,video/mp4').split(','),
        UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    },
    SECURITY_HEADERS: {
        HSTS_MAX_AGE: 31536000,
        CSP_REPORT_URI: '/api/v1/security/csp-report',
    },
};
class EncryptionService {
    static encrypt(text) {
        try {
            const encrypted = crypto_js_1.default.AES.encrypt(text, this.key).toString();
            return encrypted;
        }
        catch (error) {
            throw new Error('Encryption failed');
        }
    }
    static decrypt(encryptedText) {
        try {
            const decrypted = crypto_js_1.default.AES.decrypt(encryptedText, this.key);
            return decrypted.toString(crypto_js_1.default.enc.Utf8);
        }
        catch (error) {
            throw new Error('Decryption failed');
        }
    }
    static hash(text) {
        return crypto_js_1.default.SHA256(text).toString();
    }
    static generateRandomString(length = 32) {
        return crypto_js_1.default.lib.WordArray.random(length).toString();
    }
    static verifyChecksum(data, providedChecksum) {
        const calculatedChecksum = this.hash(JSON.stringify(data));
        return calculatedChecksum === providedChecksum;
    }
}
exports.EncryptionService = EncryptionService;
EncryptionService.key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
class PasswordValidator {
    static validate(password) {
        const errors = [];
        if (password.length < exports.SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
            errors.push(`Password must be at least ${exports.SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters long`);
        }
        if (exports.SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (exports.SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (exports.SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (exports.SECURITY_CONFIG.PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static generateSecurePassword(length = 16) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*(),.?":{}|<>';
        let password = '';
        const allChars = lowercase + uppercase + numbers + symbols;
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
}
exports.PasswordValidator = PasswordValidator;
class InputSanitizer {
    static sanitizeHtml(input) {
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    static sanitizeFileName(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '')
            .replace(/\.{2,}/g, '.')
            .substring(0, 255);
    }
    static sanitizeEmail(email) {
        return email.toLowerCase().trim();
    }
    static sanitizeUsername(username) {
        return username
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, '')
            .substring(0, 50);
    }
}
exports.InputSanitizer = InputSanitizer;
var Permission;
(function (Permission) {
    Permission["CREATE_THREAD"] = "thread:create";
    Permission["READ_THREAD"] = "thread:read";
    Permission["UPDATE_THREAD"] = "thread:update";
    Permission["DELETE_THREAD"] = "thread:delete";
    Permission["CREATE_SOLUTION"] = "solution:create";
    Permission["READ_SOLUTION"] = "solution:read";
    Permission["UPDATE_SOLUTION"] = "solution:update";
    Permission["DELETE_SOLUTION"] = "solution:delete";
    Permission["ACCEPT_SOLUTION"] = "solution:accept";
    Permission["MODERATE_SOLUTION"] = "solution:moderate";
    Permission["CREATE_COMMENT"] = "comment:create";
    Permission["READ_COMMENT"] = "comment:read";
    Permission["UPDATE_COMMENT"] = "comment:update";
    Permission["DELETE_COMMENT"] = "comment:delete";
    Permission["READ_USER"] = "user:read";
    Permission["UPDATE_USER"] = "user:update";
    Permission["DELETE_USER"] = "user:delete";
    Permission["MANAGE_USERS"] = "user:manage";
    Permission["ACCESS_ADMIN"] = "admin:access";
    Permission["VIEW_AUDIT_LOGS"] = "admin:audit";
    Permission["MANAGE_SYSTEM"] = "admin:system";
    Permission["UPLOAD_FILE"] = "file:upload";
    Permission["DELETE_FILE"] = "file:delete";
    Permission["CREATE_BOUNTY"] = "bounty:create";
    Permission["AWARD_BOUNTY"] = "bounty:award";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
    WARFIGHTER: [
        Permission.CREATE_THREAD,
        Permission.READ_THREAD,
        Permission.UPDATE_THREAD,
        Permission.CREATE_SOLUTION,
        Permission.READ_SOLUTION,
        Permission.UPDATE_SOLUTION,
        Permission.ACCEPT_SOLUTION,
        Permission.CREATE_COMMENT,
        Permission.READ_COMMENT,
        Permission.UPDATE_COMMENT,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.UPLOAD_FILE,
        Permission.CREATE_BOUNTY,
        Permission.AWARD_BOUNTY,
    ],
    INNOVATOR: [
        Permission.READ_THREAD,
        Permission.CREATE_SOLUTION,
        Permission.READ_SOLUTION,
        Permission.UPDATE_SOLUTION,
        Permission.CREATE_COMMENT,
        Permission.READ_COMMENT,
        Permission.UPDATE_COMMENT,
        Permission.READ_USER,
        Permission.UPDATE_USER,
        Permission.UPLOAD_FILE,
    ],
    MODERATOR: [
        ...Object.values(Permission).filter(p => !p.startsWith('admin:')),
        Permission.DELETE_THREAD,
        Permission.DELETE_SOLUTION,
        Permission.MODERATE_SOLUTION,
        Permission.DELETE_COMMENT,
        Permission.DELETE_FILE,
        Permission.VIEW_AUDIT_LOGS,
    ],
    ADMIN: Object.values(Permission),
};
const hasPermission = (userRole, permission) => {
    const rolePermissions = exports.ROLE_PERMISSIONS[userRole];
    return rolePermissions?.includes(permission) || false;
};
exports.hasPermission = hasPermission;
const getSecurityHeaders = () => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': `max-age=${exports.SECURITY_CONFIG.SECURITY_HEADERS.HSTS_MAX_AGE}; includeSubDomains; preload`,
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        `report-uri ${exports.SECURITY_CONFIG.SECURITY_HEADERS.CSP_REPORT_URI}`,
    ].join('; '),
});
exports.getSecurityHeaders = getSecurityHeaders;
//# sourceMappingURL=security.js.map