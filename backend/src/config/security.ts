import CryptoJS from 'crypto-js';

// Security constants
export const SECURITY_CONFIG = {
  JWT: {
    ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    ALGORITHM: 'RS256' as const,
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
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    SKIP_SUCCESSFUL_REQUESTS: false,
    SKIP_FAILED_REQUESTS: false,
  },
  
  SESSION: {
    MAX_SESSIONS_PER_USER: 5,
    CLEANUP_INTERVAL: 1000 * 60 * 60, // 1 hour
  },
  
  FILE_UPLOAD: {
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
    ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,video/mp4').split(','),
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  },
  
  SECURITY_HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1 year
    CSP_REPORT_URI: '/api/v1/security/csp-report',
  },
} as const;

// Encryption utilities
export class EncryptionService {
  private static readonly key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  
  static encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.key).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }
  
  static decrypt(encryptedText: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
  
  static hash(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }
  
  static generateRandomString(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
  
  static verifyChecksum(data: any, providedChecksum: string): boolean {
    const calculatedChecksum = this.hash(JSON.stringify(data));
    return calculatedChecksum === providedChecksum;
  }
}

// Password validation
export class PasswordValidator {
  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD.MIN_LENGTH} characters long`);
    }
    
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>';
    
    let password = '';
    const allChars = lowercase + uppercase + numbers + symbols;
    
    // Ensure at least one character from each required set
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

// Input sanitization
export class InputSanitizer {
  static sanitizeHtml(input: string): string {
    // Remove potentially dangerous HTML tags and attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  static sanitizeFileName(filename: string): string {
    // Remove dangerous characters from filename
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }
  
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
  
  static sanitizeUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .substring(0, 50);
  }
}

// Role-based permissions
export enum Permission {
  // Thread permissions
  CREATE_THREAD = 'thread:create',
  READ_THREAD = 'thread:read',
  UPDATE_THREAD = 'thread:update',
  DELETE_THREAD = 'thread:delete',
  
  // Solution permissions
  CREATE_SOLUTION = 'solution:create',
  READ_SOLUTION = 'solution:read',
  UPDATE_SOLUTION = 'solution:update',
  DELETE_SOLUTION = 'solution:delete',
  ACCEPT_SOLUTION = 'solution:accept',
  MODERATE_SOLUTION = 'solution:moderate',
  
  // Comment permissions
  CREATE_COMMENT = 'comment:create',
  READ_COMMENT = 'comment:read',
  UPDATE_COMMENT = 'comment:update',
  DELETE_COMMENT = 'comment:delete',
  
  // User permissions
  READ_USER = 'user:read',
  UPDATE_USER = 'user:update',
  DELETE_USER = 'user:delete',
  MANAGE_USERS = 'user:manage',
  
  // Admin permissions
  ACCESS_ADMIN = 'admin:access',
  VIEW_AUDIT_LOGS = 'admin:audit',
  MANAGE_SYSTEM = 'admin:system',
  
  // File permissions
  UPLOAD_FILE = 'file:upload',
  DELETE_FILE = 'file:delete',
  
  // Bounty permissions
  CREATE_BOUNTY = 'bounty:create',
  AWARD_BOUNTY = 'bounty:award',
}

export const ROLE_PERMISSIONS = {
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
} as const;

// User roles
type UserRole = 'WARFIGHTER' | 'INNOVATOR' | 'MODERATOR' | 'ADMIN';

// Check if user has permission
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] as readonly Permission[];
  return rolePermissions?.includes(permission) || false;
};

// Security headers configuration
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': `max-age=${SECURITY_CONFIG.SECURITY_HEADERS.HSTS_MAX_AGE}; includeSubDomains; preload`,
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    `report-uri ${SECURITY_CONFIG.SECURITY_HEADERS.CSP_REPORT_URI}`,
  ].join('; '),
}); 