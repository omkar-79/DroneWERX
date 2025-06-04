import * as Minio from 'minio';
import { CopyConditions } from 'minio';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import { logStructured } from '../utils/logger';

export interface UploadResult {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    checksum: string;
  };
}

export interface UploadOptions {
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  folder?: string;
}

class MediaStorageService {
  private minioClient: Minio.Client;
  private bucketName: string;
  private publicUrl: string;

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

  private async initializeBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        // Set public read policy for the bucket
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
        logStructured.info('Media storage bucket created and configured', { bucket: this.bucketName });
      }
    } catch (error) {
      logStructured.error('Failed to initialize media storage bucket', error as Error);
      throw error;
    }
  }

  /**
   * Upload a file to object storage
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const fileId = crypto.randomUUID();
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
      
      const folder = options.folder || 'general';
      const filename = `${folder}/${fileId}-${sanitizedName}${ext}`;
      
      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      
      // Prepare metadata
      const metadata: any = {
        'Content-Type': mimeType,
        'X-Original-Name': originalName,
        'X-Upload-Date': new Date().toISOString(),
        'X-Checksum': checksum,
      };

      let processedBuffer = buffer;
      let width: number | undefined;
      let height: number | undefined;
      let thumbnailUrl: string | undefined;

      // Process images
      if (mimeType.startsWith('image/')) {
        const imageInfo = await sharp(buffer).metadata();
        width = imageInfo.width;
        height = imageInfo.height;

        // Resize if needed
        if (options.maxWidth || options.maxHeight) {
          processedBuffer = await sharp(buffer)
            .resize(options.maxWidth, options.maxHeight, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: options.quality || 85 })
            .toBuffer();
        }

        // Generate thumbnail for images
        if (options.generateThumbnail !== false) {
          const thumbnailBuffer = await sharp(buffer)
            .resize(300, 300, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          const thumbnailFilename = `${folder}/thumbnails/${fileId}-thumb.jpg`;
          
          await this.minioClient.putObject(
            this.bucketName,
            thumbnailFilename,
            thumbnailBuffer,
            thumbnailBuffer.length,
            {
              'Content-Type': 'image/jpeg',
              'X-Thumbnail-For': filename,
            }
          );

          thumbnailUrl = `${this.publicUrl}/${this.bucketName}/${thumbnailFilename}`;
        }

        metadata['X-Width'] = width?.toString();
        metadata['X-Height'] = height?.toString();
      }

      // Upload main file
      await this.minioClient.putObject(
        this.bucketName,
        filename,
        processedBuffer,
        processedBuffer.length,
        metadata
      );

      const result: UploadResult = {
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

      logStructured.info('File uploaded successfully', {
        fileId,
        originalName,
        size: processedBuffer.length,
        mimeType,
      });

      return result;
    } catch (error) {
      logStructured.error('File upload failed', error as Error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file.buffer, file.originalName, file.mimeType, options))
    );
    return results;
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, filename);
      
      // Also delete thumbnail if it exists
      const thumbnailFilename = filename.replace(/\/([^/]+)$/, '/thumbnails/$1').replace(/\.[^.]+$/, '-thumb.jpg');
      try {
        await this.minioClient.removeObject(this.bucketName, thumbnailFilename);
      } catch {
        // Thumbnail might not exist, ignore error
      }

      logStructured.info('File deleted successfully', { filename });
    } catch (error) {
      logStructured.error('File deletion failed', { filename, error });
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(filename: string): Promise<any> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, filename);
      return stat;
    } catch (error) {
      logStructured.error('Failed to get file info', { filename, error });
      throw error;
    }
  }

  /**
   * Generate a presigned URL for secure access
   */
  async getPresignedUrl(filename: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(this.bucketName, filename, expiry);
      return url;
    } catch (error) {
      logStructured.error('Failed to generate presigned URL', { filename, error });
      throw error;
    }
  }

  /**
   * Create a presigned URL for uploads
   */
  async getPresignedUploadUrl(filename: string, expiry: number = 60 * 60): Promise<string> {
    try {
      const url = await this.minioClient.presignedPutObject(this.bucketName, filename, expiry);
      return url;
    } catch (error) {
      logStructured.error('Failed to generate presigned upload URL', { filename, error });
      throw error;
    }
  }

  /**
   * List files with pagination
   */
  async listFiles(prefix?: string, maxKeys?: number): Promise<any[]> {
    try {
      const objects: any[] = [];
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
    } catch (error) {
      logStructured.error('Failed to list files', { prefix, error });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, filename);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filename: string): string {
    return `${this.publicUrl}/${this.bucketName}/${filename}`;
  }

  /**
   * Copy file to another location
   */
  async copyFile(sourceFilename: string, destFilename: string): Promise<void> {
    try {
      // Get the source file
      const sourceStream = await this.minioClient.getObject(this.bucketName, sourceFilename);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      await new Promise((resolve, reject) => {
        sourceStream.on('data', (chunk) => chunks.push(chunk));
        sourceStream.on('end', resolve);
        sourceStream.on('error', reject);
      });
      const buffer = Buffer.concat(chunks);
      
      // Upload to destination
      await this.minioClient.putObject(this.bucketName, destFilename, buffer, buffer.length);
      
      logStructured.info('File copied successfully', { sourceFilename, destFilename });
    } catch (error) {
      logStructured.error('File copy failed', { sourceFilename, destFilename, error });
      throw error;
    }
  }
}

// Export singleton instance
export const mediaStorage = new MediaStorageService();
export default mediaStorage; 