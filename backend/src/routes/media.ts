import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../config/database';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { mediaStorage, UploadOptions } from '../services/mediaStorage';

const router = express.Router();

// Configure multer for memory storage (we'll handle file storage with Minio)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allowed mime types
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
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// Upload files for thread (immediate upload)
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

    // Upload files to object storage
    const uploadOptions: UploadOptions = {
      folder: `threads/${threadId}`,
      generateThumbnail: true,
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85
    };

    const uploadResults = await mediaStorage.uploadFiles(
      files.map(file => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype
      })),
      uploadOptions
    );

    // Create attachment records in database
    const attachments = [];
    for (let i = 0; i < uploadResults.length; i++) {
      const result = uploadResults[i];
      const file = files[i];

      const attachment = await prisma.attachment.create({
        data: {
          filename: result.filename,
          originalName: result.originalName,
          mimeType: result.mimeType,
          size: result.size,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          uploadedBy: req.user!.id,
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

// Upload files for solution
router.post('/solution/:solutionId/upload', authenticateToken, upload.array('files', 10), async (req, res): Promise<void> => {
  try {
    const { solutionId } = req.params;
    
    // Verify solution exists and user has permission
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId }
    });

    if (!solution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    // Allow solution author, admins, and moderators to upload files
    if (solution.authorId !== req.user!.id && 
        !['ADMIN', 'MODERATOR'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Not authorized to upload files to this solution' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }

    // Upload files to object storage
    const uploadOptions: UploadOptions = {
      folder: `solutions/${solutionId}`,
      generateThumbnail: true,
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85
    };

    const uploadResults = await mediaStorage.uploadFiles(
      files.map(file => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype
      })),
      uploadOptions
    );

    // Create attachment records in database
    const attachments = [];
    for (let i = 0; i < uploadResults.length; i++) {
      const result = uploadResults[i];

      const attachment = await prisma.attachment.create({
        data: {
          filename: result.filename,
          originalName: result.originalName,
          mimeType: result.mimeType,
          size: result.size,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          uploadedBy: req.user!.id,
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

    logStructured.info('Files uploaded to solution', {
      solutionId,
      userId: req.user!.id,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    res.status(201).json({
      message: 'Files uploaded successfully',
      attachments
    });

  } catch (error) {
    logStructured.error('Solution file upload failed', error as Error);
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
    logStructured.error('Get thread attachments failed', error as Error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
});

// Get attachments for a solution
router.get('/solution/:solutionId/attachments', async (req, res): Promise<void> => {
  try {
    const { solutionId } = req.params;

    const attachments = await prisma.attachment.findMany({
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
  } catch (error) {
    logStructured.error('Get solution attachments failed', error as Error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
});

// Delete attachment
router.delete('/attachments/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { thread: true, solution: true }
    });

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Check permissions
    const canDelete = attachment.uploadedBy === req.user!.id ||
                     attachment.thread?.authorId === req.user!.id ||
                     attachment.solution?.authorId === req.user!.id ||
                     ['ADMIN', 'MODERATOR'].includes(req.user!.role);

    if (!canDelete) {
      res.status(403).json({ error: 'Not authorized to delete this attachment' });
      return;
    }

    // Delete file from object storage
    try {
      await mediaStorage.deleteFile(attachment.storageKey);
    } catch (fileError) {
      logStructured.warn('Failed to delete file from storage', { 
        attachmentId: id, 
        storageKey: attachment.storageKey,
        error: fileError 
      });
    }

    // Delete from database
    await prisma.attachment.delete({ where: { id } });

    logStructured.info('Attachment deleted successfully', {
      attachmentId: id,
      deletedBy: req.user!.id
    });

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    logStructured.error('Delete attachment failed', error as Error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Get file info/metadata
router.get('/attachments/:id/info', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
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
  } catch (error) {
    logStructured.error('Get attachment info failed', error as Error);
    res.status(500).json({ error: 'Failed to get attachment info' });
  }
});

// Generate secure download URL
router.post('/attachments/:id/download-url', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { expiry = 3600 } = req.body; // Default 1 hour

    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Generate presigned URL for secure download
    const downloadUrl = await mediaStorage.getPresignedUrl(attachment.storageKey, expiry);

    res.json({ 
      downloadUrl,
      expiresIn: expiry,
      filename: attachment.originalName 
    });
  } catch (error) {
    logStructured.error('Generate download URL failed', error as Error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default router; 