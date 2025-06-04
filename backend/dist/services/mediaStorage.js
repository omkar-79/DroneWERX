"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaStorage = void 0;
const Minio = __importStar(require("minio"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
class MediaStorageService {
    constructor() {
        this.bucketName = process.env.MINIO_BUCKET_NAME || 'dronewerx-media';
        this.publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
        });
        this.initializeBucket();
    }
    async initializeBucket() {
        try {
            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
                        },
                    ],
                };
                await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
                logger_1.logStructured.info('Media storage bucket created and configured', { bucket: this.bucketName });
            }
        }
        catch (error) {
            logger_1.logStructured.error('Failed to initialize media storage bucket', error);
            throw error;
        }
    }
    async uploadFile(buffer, originalName, mimeType, options = {}) {
        try {
            const fileId = crypto_1.default.randomUUID();
            const ext = path_1.default.extname(originalName);
            const baseName = path_1.default.basename(originalName, ext);
            const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
            const folder = options.folder || 'general';
            const filename = `${folder}/${fileId}-${sanitizedName}${ext}`;
            const checksum = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
            const metadata = {
                'Content-Type': mimeType,
                'X-Original-Name': originalName,
                'X-Upload-Date': new Date().toISOString(),
                'X-Checksum': checksum,
            };
            let processedBuffer = buffer;
            let width;
            let height;
            let thumbnailUrl;
            if (mimeType.startsWith('image/')) {
                const imageInfo = await (0, sharp_1.default)(buffer).metadata();
                width = imageInfo.width;
                height = imageInfo.height;
                if (options.maxWidth || options.maxHeight) {
                    processedBuffer = await (0, sharp_1.default)(buffer)
                        .resize(options.maxWidth, options.maxHeight, {
                        fit: 'inside',
                        withoutEnlargement: true,
                    })
                        .jpeg({ quality: options.quality || 85 })
                        .toBuffer();
                }
                if (options.generateThumbnail !== false) {
                    const thumbnailBuffer = await (0, sharp_1.default)(buffer)
                        .resize(300, 300, {
                        fit: 'cover',
                        position: 'center',
                    })
                        .jpeg({ quality: 80 })
                        .toBuffer();
                    const thumbnailFilename = `${folder}/thumbnails/${fileId}-thumb.jpg`;
                    await this.minioClient.putObject(this.bucketName, thumbnailFilename, thumbnailBuffer, thumbnailBuffer.length, {
                        'Content-Type': 'image/jpeg',
                        'X-Thumbnail-For': filename,
                    });
                    thumbnailUrl = `${this.publicUrl}/${this.bucketName}/${thumbnailFilename}`;
                }
                metadata['X-Width'] = width?.toString();
                metadata['X-Height'] = height?.toString();
            }
            await this.minioClient.putObject(this.bucketName, filename, processedBuffer, processedBuffer.length, metadata);
            const result = {
                id: fileId,
                originalName,
                filename,
                mimeType,
                size: processedBuffer.length,
                url: `${this.publicUrl}/${this.bucketName}/${filename}`,
                thumbnailUrl,
                metadata: {
                    width,
                    height,
                    checksum,
                },
            };
            logger_1.logStructured.info('File uploaded successfully', {
                fileId,
                originalName,
                size: processedBuffer.length,
                mimeType,
            });
            return result;
        }
        catch (error) {
            logger_1.logStructured.error('File upload failed', error);
            throw error;
        }
    }
    async uploadFiles(files, options = {}) {
        const results = await Promise.all(files.map(file => this.uploadFile(file.buffer, file.originalName, file.mimeType, options)));
        return results;
    }
    async deleteFile(filename) {
        try {
            await this.minioClient.removeObject(this.bucketName, filename);
            const thumbnailFilename = filename.replace(/\/([^/]+)$/, '/thumbnails/$1').replace(/\.[^.]+$/, '-thumb.jpg');
            try {
                await this.minioClient.removeObject(this.bucketName, thumbnailFilename);
            }
            catch {
            }
            logger_1.logStructured.info('File deleted successfully', { filename });
        }
        catch (error) {
            logger_1.logStructured.error('File deletion failed', { filename, error });
            throw error;
        }
    }
    async getFileInfo(filename) {
        try {
            const stat = await this.minioClient.statObject(this.bucketName, filename);
            return stat;
        }
        catch (error) {
            logger_1.logStructured.error('Failed to get file info', { filename, error });
            throw error;
        }
    }
    async getPresignedUrl(filename, expiry = 7 * 24 * 60 * 60) {
        try {
            const url = await this.minioClient.presignedGetObject(this.bucketName, filename, expiry);
            return url;
        }
        catch (error) {
            logger_1.logStructured.error('Failed to generate presigned URL', { filename, error });
            throw error;
        }
    }
    async getPresignedUploadUrl(filename, expiry = 60 * 60) {
        try {
            const url = await this.minioClient.presignedPutObject(this.bucketName, filename, expiry);
            return url;
        }
        catch (error) {
            logger_1.logStructured.error('Failed to generate presigned upload URL', { filename, error });
            throw error;
        }
    }
    async listFiles(prefix, maxKeys) {
        try {
            const objects = [];
            const stream = this.minioClient.listObjects(this.bucketName, prefix, true);
            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => {
                    objects.push(obj);
                    if (maxKeys && objects.length >= maxKeys) {
                        stream.destroy();
                        resolve(objects);
                    }
                });
                stream.on('end', () => resolve(objects));
                stream.on('error', reject);
            });
        }
        catch (error) {
            logger_1.logStructured.error('Failed to list files', { prefix, error });
            throw error;
        }
    }
    async fileExists(filename) {
        try {
            await this.minioClient.statObject(this.bucketName, filename);
            return true;
        }
        catch {
            return false;
        }
    }
    getPublicUrl(filename) {
        return `${this.publicUrl}/${this.bucketName}/${filename}`;
    }
    async copyFile(sourceFilename, destFilename) {
        try {
            const sourceStream = await this.minioClient.getObject(this.bucketName, sourceFilename);
            const chunks = [];
            await new Promise((resolve, reject) => {
                sourceStream.on('data', (chunk) => chunks.push(chunk));
                sourceStream.on('end', resolve);
                sourceStream.on('error', reject);
            });
            const buffer = Buffer.concat(chunks);
            await this.minioClient.putObject(this.bucketName, destFilename, buffer, buffer.length);
            logger_1.logStructured.info('File copied successfully', { sourceFilename, destFilename });
        }
        catch (error) {
            logger_1.logStructured.error('File copy failed', { sourceFilename, destFilename, error });
            throw error;
        }
    }
}
exports.mediaStorage = new MediaStorageService();
exports.default = exports.mediaStorage;
//# sourceMappingURL=mediaStorage.js.map