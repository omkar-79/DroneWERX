"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        try {
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error, '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, crypto_1.default.randomUUID() + '-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
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
        const attachments = [];
        for (const file of files) {
            const buffer = await promises_1.default.readFile(file.path);
            const checksum = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            const isDocument = file.mimetype.includes('pdf') ||
                file.mimetype.includes('document') ||
                file.mimetype.includes('presentation') ||
                file.mimetype.includes('text/');
            const attachment = await database_1.prisma.attachment.create({
                data: {
                    filename: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: `/uploads/${file.filename}`,
                    uploadedBy: req.user.id,
                    threadId: threadId,
                    isImage,
                    isVideo,
                    isDocument,
                    checksum,
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
        logger_1.logStructured.error('Get attachments failed', error);
        res.status(500).json({ error: 'Failed to get attachments' });
    }
});
router.delete('/attachments/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await database_1.prisma.attachment.findUnique({
            where: { id },
            include: { thread: true }
        });
        if (!attachment) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }
        const canDelete = attachment.uploadedBy === req.user.id ||
            attachment.thread?.authorId === req.user.id ||
            ['ADMIN', 'MODERATOR'].includes(req.user.role);
        if (!canDelete) {
            res.status(403).json({ error: 'Not authorized to delete this attachment' });
            return;
        }
        try {
            const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.filename);
            await promises_1.default.unlink(filePath);
        }
        catch (fileError) {
            logger_1.logStructured.warn('Failed to delete file from disk', {
                attachmentId: id,
                filename: attachment.filename,
                error: fileError
            });
        }
        await database_1.prisma.attachment.delete({ where: { id } });
        res.json({ message: 'Attachment deleted successfully' });
    }
    catch (error) {
        logger_1.logStructured.error('Delete attachment failed', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});
router.get('/uploads/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const attachment = await database_1.prisma.attachment.findFirst({
            where: { filename }
        });
        if (!attachment) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        const filePath = path_1.default.join(process.cwd(), 'uploads', filename);
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Length', attachment.size);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
        res.sendFile(filePath);
    }
    catch (error) {
        logger_1.logStructured.error('File serve failed', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});
router.post('/temp/upload', auth_1.authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files provided' });
            return;
        }
        const tempAttachments = [];
        for (const file of files) {
            const buffer = await promises_1.default.readFile(file.path);
            const checksum = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            const isDocument = file.mimetype.includes('pdf') ||
                file.mimetype.includes('document') ||
                file.mimetype.includes('presentation') ||
                file.mimetype.includes('text/');
            const attachment = await database_1.prisma.attachment.create({
                data: {
                    filename: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: `/uploads/${file.filename}`,
                    uploadedBy: req.user.id,
                    threadId: null,
                    isImage,
                    isVideo,
                    isDocument,
                    checksum,
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
                isImage: attachment.isImage,
                isVideo: attachment.isVideo,
                isDocument: attachment.isDocument
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
router.post('/temp/attach/:threadId', auth_1.authenticateToken, async (req, res) => {
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
        const updatedAttachments = await database_1.prisma.attachment.updateMany({
            where: {
                id: { in: attachmentIds },
                uploadedBy: req.user.id,
                threadId: null
            },
            data: {
                threadId: threadId
            }
        });
        logger_1.logStructured.info('Files attached to thread', {
            threadId,
            userId: req.user.id,
            attachmentCount: updatedAttachments.count
        });
        res.json({
            message: 'Files attached successfully',
            attachedCount: updatedAttachments.count
        });
    }
    catch (error) {
        logger_1.logStructured.error('Attach files to thread failed', error);
        res.status(500).json({ error: 'Failed to attach files' });
    }
});
router.delete('/temp/cleanup', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!['ADMIN', 'MODERATOR'].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const oldTempAttachments = await database_1.prisma.attachment.findMany({
            where: {
                threadId: null,
                uploadedAt: { lt: oneHourAgo }
            }
        });
        for (const attachment of oldTempAttachments) {
            try {
                const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.filename);
                await promises_1.default.unlink(filePath);
            }
            catch (fileError) {
                logger_1.logStructured.warn('Failed to delete temp file from disk', {
                    attachmentId: attachment.id,
                    filename: attachment.filename
                });
            }
        }
        const deletedCount = await database_1.prisma.attachment.deleteMany({
            where: {
                threadId: null,
                uploadedAt: { lt: oneHourAgo }
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
//# sourceMappingURL=files.js.map