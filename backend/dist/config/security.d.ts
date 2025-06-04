export declare const SECURITY_CONFIG: {
    readonly JWT: {
        readonly ACCESS_TOKEN_EXPIRY: string;
        readonly REFRESH_TOKEN_EXPIRY: string;
        readonly ALGORITHM: "RS256";
        readonly ISSUER: "dronewerx-backend";
        readonly AUDIENCE: "dronewerx-app";
    };
    readonly ENCRYPTION: {
        readonly ALGORITHM: "AES";
        readonly KEY_SIZE: 256;
        readonly IV_SIZE: 16;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly REQUIRE_UPPERCASE: true;
        readonly REQUIRE_LOWERCASE: true;
        readonly REQUIRE_NUMBERS: true;
        readonly REQUIRE_SYMBOLS: true;
        readonly SALT_ROUNDS: 12;
    };
    readonly RATE_LIMITING: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: number;
        readonly SKIP_SUCCESSFUL_REQUESTS: false;
        readonly SKIP_FAILED_REQUESTS: false;
    };
    readonly SESSION: {
        readonly MAX_SESSIONS_PER_USER: 5;
        readonly CLEANUP_INTERVAL: number;
    };
    readonly FILE_UPLOAD: {
        readonly MAX_SIZE: number;
        readonly ALLOWED_MIME_TYPES: string[];
        readonly UPLOAD_PATH: string;
    };
    readonly SECURITY_HEADERS: {
        readonly HSTS_MAX_AGE: 31536000;
        readonly CSP_REPORT_URI: "/api/v1/security/csp-report";
    };
};
export declare class EncryptionService {
    private static readonly key;
    static encrypt(text: string): string;
    static decrypt(encryptedText: string): string;
    static hash(text: string): string;
    static generateRandomString(length?: number): string;
    static verifyChecksum(data: any, providedChecksum: string): boolean;
}
export declare class PasswordValidator {
    static validate(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static generateSecurePassword(length?: number): string;
}
export declare class InputSanitizer {
    static sanitizeHtml(input: string): string;
    static sanitizeFileName(filename: string): string;
    static sanitizeEmail(email: string): string;
    static sanitizeUsername(username: string): string;
}
export declare enum Permission {
    CREATE_THREAD = "thread:create",
    READ_THREAD = "thread:read",
    UPDATE_THREAD = "thread:update",
    DELETE_THREAD = "thread:delete",
    CREATE_SOLUTION = "solution:create",
    READ_SOLUTION = "solution:read",
    UPDATE_SOLUTION = "solution:update",
    DELETE_SOLUTION = "solution:delete",
    ACCEPT_SOLUTION = "solution:accept",
    MODERATE_SOLUTION = "solution:moderate",
    CREATE_COMMENT = "comment:create",
    READ_COMMENT = "comment:read",
    UPDATE_COMMENT = "comment:update",
    DELETE_COMMENT = "comment:delete",
    READ_USER = "user:read",
    UPDATE_USER = "user:update",
    DELETE_USER = "user:delete",
    MANAGE_USERS = "user:manage",
    ACCESS_ADMIN = "admin:access",
    VIEW_AUDIT_LOGS = "admin:audit",
    MANAGE_SYSTEM = "admin:system",
    UPLOAD_FILE = "file:upload",
    DELETE_FILE = "file:delete",
    CREATE_BOUNTY = "bounty:create",
    AWARD_BOUNTY = "bounty:award"
}
export declare const ROLE_PERMISSIONS: {
    readonly WARFIGHTER: readonly [Permission.CREATE_THREAD, Permission.READ_THREAD, Permission.UPDATE_THREAD, Permission.CREATE_SOLUTION, Permission.READ_SOLUTION, Permission.UPDATE_SOLUTION, Permission.ACCEPT_SOLUTION, Permission.CREATE_COMMENT, Permission.READ_COMMENT, Permission.UPDATE_COMMENT, Permission.READ_USER, Permission.UPDATE_USER, Permission.UPLOAD_FILE, Permission.CREATE_BOUNTY, Permission.AWARD_BOUNTY];
    readonly INNOVATOR: readonly [Permission.READ_THREAD, Permission.CREATE_SOLUTION, Permission.READ_SOLUTION, Permission.UPDATE_SOLUTION, Permission.CREATE_COMMENT, Permission.READ_COMMENT, Permission.UPDATE_COMMENT, Permission.READ_USER, Permission.UPDATE_USER, Permission.UPLOAD_FILE];
    readonly MODERATOR: readonly [...Permission[], Permission.DELETE_THREAD, Permission.DELETE_SOLUTION, Permission.MODERATE_SOLUTION, Permission.DELETE_COMMENT, Permission.DELETE_FILE, Permission.VIEW_AUDIT_LOGS];
    readonly ADMIN: Permission[];
};
type UserRole = 'WARFIGHTER' | 'INNOVATOR' | 'MODERATOR' | 'ADMIN';
export declare const hasPermission: (userRole: UserRole, permission: Permission) => boolean;
export declare const getSecurityHeaders: () => {
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'Permissions-Policy': string;
    'Strict-Transport-Security': string;
    'Content-Security-Policy': string;
};
export {};
