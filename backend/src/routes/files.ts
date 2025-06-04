import express from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../config/database';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import crypto from 'crypto';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + '-' + uniqueSuffix + ext);
  }
});

// File filter for security
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed mime types
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
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files at once
  }
});

// Upload files for thread
router.post('/thread/:threadId/upload', authenticateToken, upload.array('files', 10), async (req, res): Promise<void> => {
  try {
    const { threadId } = req.params;
    
    // Verify thread exists and user has permission
    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // Allow thread author, admins, and moderators to upload files
    if (thread.authorId !== req.user!.id && 
        !['ADMIN', 'MODERATOR'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Not authorized to upload files to this thread' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }

    // Process each file
    const attachments = [];
    for (const file of files) {
      // Calculate checksum
      const buffer = await fs.readFile(file.path);
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      // Determine file type flags
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      const isDocument = file.mimetype.includes('pdf') || 
                        file.mimetype.includes('document') || 
                        file.mimetype.includes('presentation') ||
                        file.mimetype.includes('text/');

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          uploadedBy: req.user!.id,
          threadId: threadId,
          isImage,
          isVideo,
          isDocument,
          checksum,
          virusScanned: false // TODO: Implement virus scanning
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

    logStructured.info('Files uploaded to thread', {
      threadId,
      userId: req.user!.id,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    res.status(201).json({
      message: 'Files uploaded successfully',
      attachments
    });

  } catch (error) {
    logStructured.error('File upload failed', error as Error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get attachments for a thread
router.get('/thread/:threadId/attachments', async (req, res): Promise<void> => {
  try {
    const { threadId } = req.params;

    const attachments = await prisma.attachment.findMany({
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
  } catch (error) {
    logStructured.error('Get attachments failed', error as Error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
});

// Delete attachment
router.delete('/attachments/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { thread: true }
    });

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Check permissions
    const canDelete = attachment.uploadedBy === req.user!.id ||
                     attachment.thread?.authorId === req.user!.id ||
                     ['ADMIN', 'MODERATOR'].includes(req.user!.role);

    if (!canDelete) {
      res.status(403).json({ error: 'Not authorized to delete this attachment' });
      return;
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
      await fs.unlink(filePath);
    } catch (fileError) {
      logStructured.warn('Failed to delete file from disk', { 
        attachmentId: id, 
        filename: attachment.filename,
        error: fileError 
      });
    }

    // Delete from database
    await prisma.attachment.delete({ where: { id } });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    logStructured.error('Delete attachment failed', error as Error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', async (req, res): Promise<void> => {
  try {
    const { filename } = req.params;
    
    // Verify file exists in database
    const attachment = await prisma.attachment.findFirst({
      where: { filename }
    });

    if (!attachment) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.size);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    
    // Stream the file
    res.sendFile(filePath);
  } catch (error) {
    logStructured.error('File serve failed', error as Error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Upload files temporarily (before thread creation)
router.post('/temp/upload', authenticateToken, upload.array('files', 10), async (req, res): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }

    // Process each file and create temporary attachment records
    const tempAttachments = [];
    for (const file of files) {
      // Calculate checksum
      const buffer = await fs.readFile(file.path);
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      // Determine file type flags
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      const isDocument = file.mimetype.includes('pdf') || 
                        file.mimetype.includes('document') || 
                        file.mimetype.includes('presentation') ||
                        file.mimetype.includes('text/');

      // Create temporary attachment record (without threadId)
      const attachment = await prisma.attachment.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          uploadedBy: req.user!.id,
          threadId: null, // Will be updated when thread is created
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

    logStructured.info('Temporary files uploaded', {
      userId: req.user!.id,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    res.status(201).json({
      message: 'Files uploaded successfully',
      attachments: tempAttachments
    });

  } catch (error) {
    logStructured.error('Temporary file upload failed', error as Error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Attach temporary files to a thread
router.post('/temp/attach/:threadId', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { threadId } = req.params;
    const { attachmentIds } = req.body;

    if (!attachmentIds || !Array.isArray(attachmentIds)) {
      res.status(400).json({ error: 'Attachment IDs array is required' });
      return;
    }

    // Verify thread exists and user has permission
    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    if (thread.authorId !== req.user!.id && 
        !['ADMIN', 'MODERATOR'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Not authorized to attach files to this thread' });
      return;
    }

    // Update attachments to link them to the thread
    const updatedAttachments = await prisma.attachment.updateMany({
      where: {
        id: { in: attachmentIds },
        uploadedBy: req.user!.id,
        threadId: null // Only attach unattached files
      },
      data: {
        threadId: threadId
      }
    });

    logStructured.info('Files attached to thread', {
      threadId,
      userId: req.user!.id,
      attachmentCount: updatedAttachments.count
    });

    res.json({
      message: 'Files attached successfully',
      attachedCount: updatedAttachments.count
    });

  } catch (error) {
    logStructured.error('Attach files to thread failed', error as Error);
    res.status(500).json({ error: 'Failed to attach files' });
  }
});

// Clean up temporary files older than 1 hour
router.delete('/temp/cleanup', authenticateToken, async (req, res): Promise<void> => {
  try {
    // Only allow admins to run cleanup
    if (!['ADMIN', 'MODERATOR'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find temporary attachments older than 1 hour
    const oldTempAttachments = await prisma.attachment.findMany({
      where: {
        threadId: null,
        uploadedAt: { lt: oneHourAgo }
      }
    });

    // Delete files from disk and database
    for (const attachment of oldTempAttachments) {
      try {
        const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
        await fs.unlink(filePath);
      } catch (fileError) {
        logStructured.warn('Failed to delete temp file from disk', { 
          attachmentId: attachment.id, 
          filename: attachment.filename 
        });
      }
    }

    // Delete from database
    const deletedCount = await prisma.attachment.deleteMany({
      where: {
        threadId: null,
        uploadedAt: { lt: oneHourAgo }
      }
    });

    logStructured.info('Temporary files cleaned up', {
      deletedCount: deletedCount.count,
      cleanedBy: req.user!.id
    });

    res.json({
      message: 'Cleanup completed',
      deletedCount: deletedCount.count
    });

  } catch (error) {
    logStructured.error('Cleanup temp files failed', error as Error);
    res.status(500).json({ error: 'Failed to cleanup temporary files' });
  }
});

export default router; 