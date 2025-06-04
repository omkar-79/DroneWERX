"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const mediaStorage_1 = require("../services/mediaStorage");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/avi',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
            'application/zip',
            'application/x-rar-compressed',
            'application/json'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});
router.post('/thread/:threadId/upload', auth_1.authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await database_1.prisma.thread.findUnique({
            where: { id: threadId }
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (thread.authorId !== req.user.id &&
            !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to upload files to this thread' });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files provided' });
            return;
        }
        const uploadOptions = {
            folder: `threads/${threadId}`,
            generateThumbnail: true,
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 85
        };
        const uploadResults = await mediaStorage_1.mediaStorage.uploadFiles(files.map(file => ({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype
        })), uploadOptions);
        const attachments = [];
        for (let i = 0; i < uploadResults.length; i++) {
            const result = uploadResults[i];
            const file = files[i];
            const attachment = await database_1.prisma.attachment.create({
                data: {
                    filename: result.filename,
                    originalName: result.originalName,
                    mimeType: result.mimeType,
                    size: result.size,
                    url: result.url,
                    thumbnailUrl: result.thumbnailUrl,
                    uploadedBy: req.user.id,
                    threadId: threadId,
                    storageKey: result.filename,
                    bucketName: 'dronewerx-media',
                    isImage: result.mimeType.startsWith('image/'),
                    isVideo: result.mimeType.startsWith('video/'),
                    isDocument: result.mimeType.includes('pdf') ||
                        result.mimeType.includes('document') ||
                        result.mimeType.includes('presentation') ||
                        result.mimeType.includes('spreadsheet') ||
                        result.mimeType.includes('text/'),
                    width: result.metadata.width,
                    height: result.metadata.height,
                    checksum: result.metadata.checksum,
                    isProcessed: true,
                    virusScanned: false
                },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true
                        }
                    }
                }
            });
            attachments.push(attachment);
        }
        logger_1.logStructured.info('Files uploaded to thread', {
            threadId,
            userId: req.user.id,
            fileCount: files.length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0)
        });
        res.status(201).json({
            message: 'Files uploaded successfully',
            attachments
        });
    }
    catch (error) {
        logger_1.logStructured.error('File upload failed', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});
router.post('/solution/:solutionId/upload', auth_1.authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        const { solutionId } = req.params;
        const solution = await database_1.prisma.solution.findUnique({
            where: { id: solutionId }
        });
        if (!solution) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }
        if (solution.authorId !== req.user.id &&
            !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to upload files to this solution' });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files provided' });
            return;
        }
        const uploadOptions = {
            folder: `solutions/${solutionId}`,
            generateThumbnail: true,
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 85
        };
        const uploadResults = await mediaStorage_1.mediaStorage.uploadFiles(files.map(file => ({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype
        })), uploadOptions);
        const attachments = [];
        for (let i = 0; i < uploadResults.length; i++) {
            const result = uploadResults[i];
            const attachment = await database_1.prisma.attachment.create({
                data: {
                    filename: result.filename,
                    originalName: result.originalName,
                    mimeType: result.mimeType,
                    size: result.size,
                    url: result.url,
                    thumbnailUrl: result.thumbnailUrl,
                    uploadedBy: req.user.id,
                    solutionId: solutionId,
                    storageKey: result.filename,
                    bucketName: 'dronewerx-media',
                    isImage: result.mimeType.startsWith('image/'),
                    isVideo: result.mimeType.startsWith('video/'),
                    isDocument: result.mimeType.includes('pdf') ||
                        result.mimeType.includes('document') ||
                        result.mimeType.includes('presentation') ||
                        result.mimeType.includes('spreadsheet') ||
                        result.mimeType.includes('text/'),
                    width: result.metadata.width,
                    height: result.metadata.height,
                    checksum: result.metadata.checksum,
                    isProcessed: true,
                    virusScanned: false
                },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true
                        }
                    }
                }
            });
            attachments.push(attachment);
        }
        logger_1.logStructured.info('Files uploaded to solution', {
            solutionId,
            userId: req.user.id,
            fileCount: files.length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0)
        });
        res.status(201).json({
            message: 'Files uploaded successfully',
            attachments
        });
    }
    catch (error) {
        logger_1.logStructured.error('Solution file upload failed', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});
router.post('/temp/upload', auth_1.authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files provided' });
            return;
        }
        const uploadOptions = {
            folder: `temp/${req.user.id}`,
            generateThumbnail: true,
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 85
        };
        const uploadResults = await mediaStorage_1.mediaStorage.uploadFiles(files.map(file => ({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype
        })), uploadOptions);
        const tempAttachments = [];
        for (const result of uploadResults) {
            const attachment = await database_1.prisma.attachment.create({
                data: {
                    filename: result.filename,
                    originalName: result.originalName,
                    mimeType: result.mimeType,
                    size: result.size,
                    url: result.url,
                    thumbnailUrl: result.thumbnailUrl,
                    uploadedBy: req.user.id,
                    storageKey: result.filename,
                    bucketName: 'dronewerx-media',
                    isImage: result.mimeType.startsWith('image/'),
                    isVideo: result.mimeType.startsWith('video/'),
                    isDocument: result.mimeType.includes('pdf') ||
                        result.mimeType.includes('document') ||
                        result.mimeType.includes('presentation') ||
                        result.mimeType.includes('spreadsheet') ||
                        result.mimeType.includes('text/'),
                    width: result.metadata.width,
                    height: result.metadata.height,
                    checksum: result.metadata.checksum,
                    isProcessed: true,
                    virusScanned: false
                }
            });
            tempAttachments.push({
                id: attachment.id,
                filename: attachment.filename,
                originalName: attachment.originalName,
                mimeType: attachment.mimeType,
                size: attachment.size,
                url: attachment.url,
                thumbnailUrl: attachment.thumbnailUrl,
                isImage: attachment.isImage,
                isVideo: attachment.isVideo,
                isDocument: attachment.isDocument,
                width: attachment.width,
                height: attachment.height
            });
        }
        logger_1.logStructured.info('Temporary files uploaded', {
            userId: req.user.id,
            fileCount: files.length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0)
        });
        res.status(201).json({
            message: 'Files uploaded successfully',
            attachments: tempAttachments
        });
    }
    catch (error) {
        logger_1.logStructured.error('Temporary file upload failed', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});
router.post('/temp/attach/thread/:threadId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { threadId } = req.params;
        const { attachmentIds } = req.body;
        if (!attachmentIds || !Array.isArray(attachmentIds)) {
            res.status(400).json({ error: 'Attachment IDs array is required' });
            return;
        }
        const thread = await database_1.prisma.thread.findUnique({
            where: { id: threadId }
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (thread.authorId !== req.user.id &&
            !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to attach files to this thread' });
            return;
        }
        const attachments = await database_1.prisma.attachment.findMany({
            where: {
                id: { in: attachmentIds },
                uploadedBy: req.user.id,
                threadId: null,
                solutionId: null
            }
        });
        for (const attachment of attachments) {
            const newStorageKey = `threads/${threadId}/${attachment.filename.split('/').pop()}`;
            await mediaStorage_1.mediaStorage.copyFile(attachment.storageKey, newStorageKey);
            await mediaStorage_1.mediaStorage.deleteFile(attachment.storageKey);
            await database_1.prisma.attachment.update({
                where: { id: attachment.id },
                data: {
                    threadId: threadId,
                    storageKey: newStorageKey,
                    url: mediaStorage_1.mediaStorage.getPublicUrl(newStorageKey)
                }
            });
        }
        logger_1.logStructured.info('Files attached to thread', {
            threadId,
            userId: req.user.id,
            attachmentCount: attachments.length
        });
        res.json({
            message: 'Files attached successfully',
            attachedCount: attachments.length
        });
    }
    catch (error) {
        logger_1.logStructured.error('Attach files to thread failed', error);
        res.status(500).json({ error: 'Failed to attach files' });
    }
});
router.post('/temp/attach/solution/:solutionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { solutionId } = req.params;
        const { attachmentIds } = req.body;
        if (!attachmentIds || !Array.isArray(attachmentIds)) {
            res.status(400).json({ error: 'Attachment IDs array is required' });
            return;
        }
        const solution = await database_1.prisma.solution.findUnique({
            where: { id: solutionId }
        });
        if (!solution) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }
        if (solution.authorId !== req.user.id &&
            !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to attach files to this solution' });
            return;
        }
        const attachments = await database_1.prisma.attachment.findMany({
            where: {
                id: { in: attachmentIds },
                uploadedBy: req.user.id,
                threadId: null,
                solutionId: null
            }
        });
        for (const attachment of attachments) {
            const newStorageKey = `solutions/${solutionId}/${attachment.filename.split('/').pop()}`;
            await mediaStorage_1.mediaStorage.copyFile(attachment.storageKey, newStorageKey);
            await mediaStorage_1.mediaStorage.deleteFile(attachment.storageKey);
            await database_1.prisma.attachment.update({
                where: { id: attachment.id },
                data: {
                    solutionId: solutionId,
                    storageKey: newStorageKey,
                    url: mediaStorage_1.mediaStorage.getPublicUrl(newStorageKey)
                }
            });
        }
        logger_1.logStructured.info('Files attached to solution', {
            solutionId,
            userId: req.user.id,
            attachmentCount: attachments.length
        });
        res.json({
            message: 'Files attached successfully',
            attachedCount: attachments.length
        });
    }
    catch (error) {
        logger_1.logStructured.error('Attach files to solution failed', error);
        res.status(500).json({ error: 'Failed to attach files' });
    }
});
router.get('/thread/:threadId/attachments', async (req, res) => {
    try {
        const { threadId } = req.params;
        const attachments = await database_1.prisma.attachment.findMany({
            where: { threadId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true
                    }
                }
            },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json({ attachments });
    }
    catch (error) {
        logger_1.logStructured.error('Get thread attachments failed', error);
        res.status(500).json({ error: 'Failed to get attachments' });
    }
});
router.get('/solution/:solutionId/attachments', async (req, res) => {
    try {
        const { solutionId } = req.params;
        const attachments = await database_1.prisma.attachment.findMany({
            where: { solutionId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true
                    }
                }
            },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json({ attachments });
    }
    catch (error) {
        logger_1.logStructured.error('Get solution attachments failed', error);
        res.status(500).json({ error: 'Failed to get attachments' });
    }
});
router.delete('/attachments/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await database_1.prisma.attachment.findUnique({
            where: { id },
            include: { thread: true, solution: true }
        });
        if (!attachment) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }
        const canDelete = attachment.uploadedBy === req.user.id ||
            attachment.thread?.authorId === req.user.id ||
            attachment.solution?.authorId === req.user.id ||
            ['ADMIN', 'MODERATOR'].includes(req.user.role);
        if (!canDelete) {
            res.status(403).json({ error: 'Not authorized to delete this attachment' });
            return;
        }
        try {
            await mediaStorage_1.mediaStorage.deleteFile(attachment.storageKey);
        }
        catch (fileError) {
            logger_1.logStructured.warn('Failed to delete file from storage', {
                attachmentId: id,
                storageKey: attachment.storageKey,
                error: fileError
            });
        }
        await database_1.prisma.attachment.delete({ where: { id } });
        logger_1.logStructured.info('Attachment deleted successfully', {
            attachmentId: id,
            deletedBy: req.user.id
        });
        res.json({ message: 'Attachment deleted successfully' });
    }
    catch (error) {
        logger_1.logStructured.error('Delete attachment failed', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});
router.get('/attachments/:id/info', async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await database_1.prisma.attachment.findUnique({
            where: { id },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true
                    }
                }
            }
        });
        if (!attachment) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }
        res.json({ attachment });
    }
    catch (error) {
        logger_1.logStructured.error('Get attachment info failed', error);
        res.status(500).json({ error: 'Failed to get attachment info' });
    }
});
router.post('/attachments/:id/download-url', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { expiry = 3600 } = req.body;
        const attachment = await database_1.prisma.attachment.findUnique({
            where: { id }
        });
        if (!attachment) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }
        const downloadUrl = await mediaStorage_1.mediaStorage.getPresignedUrl(attachment.storageKey, expiry);
        res.json({
            downloadUrl,
            expiresIn: expiry,
            filename: attachment.originalName
        });
    }
    catch (error) {
        logger_1.logStructured.error('Generate download URL failed', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});
router.delete('/temp/cleanup', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!['ADMIN', 'MODERATOR'].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oldTempAttachments = await database_1.prisma.attachment.findMany({
            where: {
                threadId: null,
                solutionId: null,
                uploadedAt: { lt: oneDayAgo }
            }
        });
        for (const attachment of oldTempAttachments) {
            try {
                await mediaStorage_1.mediaStorage.deleteFile(attachment.storageKey);
            }
            catch (fileError) {
                logger_1.logStructured.warn('Failed to delete temp file from storage', {
                    attachmentId: attachment.id,
                    storageKey: attachment.storageKey
                });
            }
        }
        const deletedCount = await database_1.prisma.attachment.deleteMany({
            where: {
                threadId: null,
                solutionId: null,
                uploadedAt: { lt: oneDayAgo }
            }
        });
        logger_1.logStructured.info('Temporary files cleaned up', {
            deletedCount: deletedCount.count,
            cleanedBy: req.user.id
        });
        res.json({
            message: 'Cleanup completed',
            deletedCount: deletedCount.count
        });
    }
    catch (error) {
        logger_1.logStructured.error('Cleanup temp files failed', error);
        res.status(500).json({ error: 'Failed to cleanup temporary files' });
    }
});
exports.default = router;
//# sourceMappingURL=media.js.map