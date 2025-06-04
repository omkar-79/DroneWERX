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
declare class MediaStorageService {
    private minioClient;
    private bucketName;
    private publicUrl;
    constructor();
    private initializeBucket;
    uploadFile(buffer: Buffer, originalName: string, mimeType: string, options?: UploadOptions): Promise<UploadResult>;
    uploadFiles(files: Array<{
        buffer: Buffer;
        originalName: string;
        mimeType: string;
    }>, options?: UploadOptions): Promise<UploadResult[]>;
    deleteFile(filename: string): Promise<void>;
    getFileInfo(filename: string): Promise<any>;
    getPresignedUrl(filename: string, expiry?: number): Promise<string>;
    getPresignedUploadUrl(filename: string, expiry?: number): Promise<string>;
    listFiles(prefix?: string, maxKeys?: number): Promise<any[]>;
    fileExists(filename: string): Promise<boolean>;
    getPublicUrl(filename: string): string;
    copyFile(sourceFilename: string, destFilename: string): Promise<void>;
}
export declare const mediaStorage: MediaStorageService;
export default mediaStorage;
