import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';
import { cacheService } from '../config/database';
import { InputSanitizer, SECURITY_CONFIG } from '../config/security';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { trackSolutionCreated, trackVoteCreated } from '../utils/activityTracker';
import { mediaStorage, UploadOptions } from '../services/mediaStorage';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = SECURITY_CONFIG.FILE_UPLOAD.UPLOAD_PATH;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedName = InputSanitizer.sanitizeFileName(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// Configure multer for media storage (memory-based for Minio)
const mediaUpload = multer({
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

const upload = multer({
  storage,
  limits: { 
    fileSize: SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE,
    files: 20 // Maximum 20 files per upload
  },
  fileFilter: (req, file, cb) => {
    if (SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// Validation schemas
const createSolutionSchema = z.object({
  threadId: z.string().uuid(),
  description: z.string().min(10).max(2000),
  costEstimate: z.number().positive().optional(),
  timelineEstimate: z.string().max(100).optional(),
  trlLevel: z.number().min(1).max(9).optional(),
  technicalSpecs: z.string().max(1000).optional(),
  implementationPlan: z.string().max(1000).optional(),
  riskAssessment: z.string().max(1000).optional(),
});

const updateSolutionSchema = z.object({
  description: z.string().min(10).max(2000).optional(),
  costEstimate: z.number().positive().optional(),
  timelineEstimate: z.string().max(100).optional(),
  trlLevel: z.number().min(1).max(9).optional(),
  technicalSpecs: z.string().max(1000).optional(),
  implementationPlan: z.string().max(1000).optional(),
  riskAssessment: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
});

// Get solutions for a specific thread
router.get('/thread/:threadId', async (req, res): Promise<void> => {
  try {
    const { threadId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      threadId,
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const solutions = await prisma.solution.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.solution.count({ where: whereClause });

    res.json({
      solutions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get solutions failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific solution
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const solution = await prisma.solution.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
            serviceBranch: true,
            yearsOfService: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
            status: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!solution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    res.json({ solution });
  } catch (error) {
    console.error('Get solution failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new solution with attachments support
router.post('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const createSchema = z.object({
      threadId: z.string().uuid(),
      title: z.string().min(5).max(200),
      content: z.string().min(10),
      estimatedCost: z.number().optional(),
      implementationTime: z.string().optional(),
      trlLevel: z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
      attachmentIds: z.array(z.string().uuid()).optional().default([]),
    });

    const validatedData = createSchema.parse(req.body);

    // Check if thread exists and is open
    const thread = await prisma.thread.findUnique({
      where: { id: validatedData.threadId },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    if (thread.status === 'CLOSED') {
      res.status(400).json({ error: 'Cannot add solutions to closed thread' });
      return;
    }

    // Validate attachment ownership if attachmentIds provided
    if (validatedData.attachmentIds && validatedData.attachmentIds.length > 0) {
      const attachments = await prisma.attachment.findMany({
        where: {
          id: { in: validatedData.attachmentIds },
          uploadedBy: req.user!.id,
          solutionId: null, // Must be unattached
        },
      });

      if (attachments.length !== validatedData.attachmentIds.length) {
        res.status(400).json({ 
          error: 'Some attachments not found or not owned by user' 
        });
        return;
      }
    }

    // Create solution
    const solution = await prisma.solution.create({
      data: {
        threadId: validatedData.threadId,
        title: validatedData.title,
        content: validatedData.content,
        estimatedCost: validatedData.estimatedCost,
        implementationTime: validatedData.implementationTime,
        trlLevel: validatedData.trlLevel,
        authorId: req.user!.id,
        status: 'SUBMITTED',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Associate attachments with the solution
    if (validatedData.attachmentIds && validatedData.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: {
          id: { in: validatedData.attachmentIds },
          uploadedBy: req.user!.id,
        },
        data: {
          solutionId: solution.id,
        },
      });
    }

    // Update thread solution count
    await prisma.thread.update({
      where: { id: validatedData.threadId },
      data: { solutionCount: { increment: 1 } },
    });

    // Update user stats
    await trackSolutionCreated(req.user!.id, validatedData.threadId, solution.title);

    // Fetch the complete solution with attachments
    const completeSolution = await prisma.solution.findUnique({
      where: { id: solution.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Solution created successfully',
      solution: completeSolution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Create solution failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create solution with media files (direct upload)
router.post('/with-media', authenticateToken, mediaUpload.array('files', 10), async (req, res): Promise<void> => {
  try {
    const createSchema = z.object({
      threadId: z.string().uuid(),
      title: z.string().min(5).max(200),
      content: z.string().min(10),
      estimatedCost: z.string().optional().transform(val => val ? parseFloat(val) : undefined).pipe(z.number().optional()),
      implementationTime: z.string().optional(),
      trlLevel: z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
    });

    const validatedData = createSchema.parse(req.body);

    // Check if thread exists and is open
    const thread = await prisma.thread.findUnique({
      where: { id: validatedData.threadId },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    if (thread.status === 'CLOSED') {
      res.status(400).json({ error: 'Cannot add solutions to closed thread' });
      return;
    }

    // Create solution first
    const solution = await prisma.solution.create({
      data: {
        threadId: validatedData.threadId,
        title: validatedData.title,
        content: validatedData.content,
        estimatedCost: validatedData.estimatedCost,
        implementationTime: validatedData.implementationTime,
        trlLevel: validatedData.trlLevel,
        authorId: req.user!.id,
        status: 'SUBMITTED',
      },
    });

    // Handle file uploads if any
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      // Upload files to object storage
      const uploadOptions: UploadOptions = {
        folder: `solutions/${solution.id}`,
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
      for (const result of uploadResults) {
        await prisma.attachment.create({
          data: {
            filename: result.filename,
            originalName: result.originalName,
            mimeType: result.mimeType,
            size: result.size,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            uploadedBy: req.user!.id,
            solutionId: solution.id,
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
      }
    }

    // Update thread solution count
    await prisma.thread.update({
      where: { id: validatedData.threadId },
      data: { solutionCount: { increment: 1 } },
    });

    // Update user stats
    await trackSolutionCreated(req.user!.id, validatedData.threadId, solution.title);

    // Fetch the complete solution with attachments
    const completeSolution = await prisma.solution.findUnique({
      where: { id: solution.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Solution created successfully',
      solution: completeSolution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Create solution with media failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update solution
router.put('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    
    const updateSchema = z.object({
      title: z.string().min(5).max(200).optional(),
      content: z.string().min(10).optional(),
      technicalSpecs: z.string().optional(),
      implementationPlan: z.string().optional(),
      riskAssessment: z.string().optional(),
      status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
      estimatedCost: z.number().optional(),
      implementationTime: z.string().optional(),
      trlLevel: z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Check if solution exists and user has permission
    const existingSolution = await prisma.solution.findUnique({
      where: { id },
      include: { thread: true },
    });

    if (!existingSolution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    if (existingSolution.authorId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'MODERATOR') {
      res.status(403).json({ error: 'Not authorized to update this solution' });
      return;
    }

    // Remove undefined values
    const sanitizedData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const solution = await prisma.solution.update({
      where: { id },
      data: {
        ...sanitizedData,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    res.json({
      message: 'Solution updated successfully',
      solution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Update solution failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete solution
router.delete('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if solution exists and user has permission
    const solution = await prisma.solution.findUnique({
      where: { id },
      include: { thread: true },
    });

    if (!solution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    if (solution.authorId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'MODERATOR') {
      res.status(403).json({ error: 'Not authorized to delete this solution' });
      return;
    }

    // Delete solution (will cascade delete comments and attachments)
    await prisma.solution.delete({
      where: { id },
    });

    // Update thread solution count
    await prisma.thread.update({
      where: { id: solution.threadId },
      data: { solutionCount: { decrement: 1 } },
    });

    // Update user stats - decrement solution count
    await prisma.userStats.update({
      where: { userId: solution.authorId },
      data: {
        solutionsPosted: { decrement: 1 },
      },
    });

    res.json({ message: 'Solution deleted successfully' });
  } catch (error) {
    console.error('Delete solution failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vote on solution
router.post('/:id/vote', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['UPVOTE', 'DOWNVOTE'].includes(type)) {
      res.status(400).json({ error: 'Invalid vote type' });
      return;
    }

    // Check if solution exists
    const solution = await prisma.solution.findUnique({
      where: { id },
      include: { thread: true },
    });

    if (!solution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: req.user!.id,
          targetId: id,
          targetType: 'solution',
        },
      },
    });

    let isNew = true;
    let wasOpposite = false;

    if (existingVote) {
      if (existingVote.type === type) {
        res.status(400).json({ error: 'Already voted' });
        return;
      }

      // Update existing vote
      wasOpposite = true;
      isNew = false;
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { type },
      });
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          userId: req.user!.id,
          targetId: id,
          targetType: 'solution',
          type,
        },
      });
    }

    // Update vote counts
    const votes = await prisma.vote.groupBy({
      by: ['type'],
      where: {
        targetId: id,
        targetType: 'solution',
      },
      _count: true,
    });

    const upvotes = votes.find(v => v.type === 'UPVOTE')?._count || 0;
    const downvotes = votes.find(v => v.type === 'DOWNVOTE')?._count || 0;

    await prisma.solution.update({
      where: { id },
      data: {
        upvotes,
        downvotes,
      },
    });

    await trackVoteCreated(
      req.user!.id,
      solution.authorId,
      solution.threadId,
      'solution',
      type,
      isNew,
      wasOpposite
    );

    res.json({
      message: 'Vote recorded successfully',
      votes: { upvotes, downvotes },
    });
  } catch (error) {
    console.error('Vote failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update solution status (moderator/admin/thread author only)
router.put('/:id/status', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // Accept frontend statuses and map to backend if needed
    const allowedStatuses = ['PENDING', 'PASS', 'FAIL', 'APPROVED'];
    if (!status || !allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    // Find the solution and thread
    const solution = await prisma.solution.findUnique({
      where: { id },
      include: { thread: true },
    });
    if (!solution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    // Only moderators, admins, or thread author can update status
    const user = req.user!;
    const isAllowed =
      user.role === 'ADMIN' ||
      user.role === 'MODERATOR' ||
      user.id === solution.thread.authorId;
    if (!isAllowed) {
      res.status(403).json({ error: 'Not authorized to update solution status' });
      return;
    }

    // Update status and note
    const updated = await prisma.solution.update({
      where: { id },
      data: {
        status,
        statusNote: note,
        statusUpdatedBy: user.id,
        statusUpdatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Automatically update thread's isAcceptedSolution and status
    if (status === 'APPROVED') {
      await prisma.thread.update({
        where: { id: solution.thread.id },
        data: {
          isAcceptedSolution: true,
          status: 'SOLVED',
        },
      });
    } else {
      // Check if any other solution for this thread is still approved
      const approvedCount = await prisma.solution.count({
        where: {
          threadId: solution.thread.id,
          status: 'APPROVED',
        },
      });
      if (approvedCount === 0) {
        await prisma.thread.update({
          where: { id: solution.thread.id },
          data: {
            isAcceptedSolution: false,
            status: 'OPEN',
          },
        });
      }
    }

    res.json({
      message: 'Solution status updated successfully',
      solution: updated,
    });
  } catch (error) {
    console.error('Update solution status failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 