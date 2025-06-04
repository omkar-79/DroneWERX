import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { cacheService } from '../config/database';
import { InputSanitizer } from '../config/security';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { trackThreadCreated, trackVoteCreated, trackCommentCreated } from '../utils/activityTracker';

const router = express.Router();

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  urgency: z.enum(['ROUTINE', 'PRIORITY', 'IMMEDIATE', 'FLASH']).default('ROUTINE'),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).max(10).default([]),
  trlLevel: z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
  domain: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  deadline: z.string().datetime().optional(),
  isAnonymous: z.boolean().default(false),
  bountyAmount: z.number().positive().optional(),
  bountyDescription: z.string().min(10).max(500).optional(),
  bountyDeadline: z.string().datetime().optional(),
  isClassified: z.boolean().default(false),
  requiredClearance: z.string().max(50).optional(),
});

const updateThreadSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  bountyAmount: z.number().positive().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED']).optional(),
  isClassified: z.boolean().optional(),
  requiredClearance: z.string().max(50).optional(),
  deadline: z.string().datetime().optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['created', 'updated', 'priority', 'bounty', 'votes']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  authorId: z.string().uuid().optional(),
});

// Get all threads with filtering and pagination
router.get('/', async (req, res): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const category = req.query.category as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (category) {
      whereClause.categoryId = category;
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (priority) {
      whereClause.priority = priority.toUpperCase();
    }

    const threads = await prisma.thread.findMany({
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
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            solutions: true,
            comments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.thread.count({ where: whereClause });

    res.json({
      threads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get threads failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories endpoint
router.get('/categories', async (req, res): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        threadCount: true,
      },
      orderBy: [
        { threadCount: 'desc' },
        { name: 'asc' }
      ],
    });

    res.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Get categories failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tags endpoint
router.get('/tags', async (req, res): Promise<void> => {
  try {
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        color: true,
        usageCount: true,
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ],
      take: 50, // Limit to top 50 most used tags
    });

    res.json({
      tags,
      total: tags.length,
    });
  } catch (error) {
    console.error('Get tags failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single thread
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const thread = await prisma.thread.findUnique({
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
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        solutions: {
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
            attachments: true,
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: [
            { isAccepted: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        attachments: true,
        bounty: true,
        _count: {
          select: {
            solutions: true,
            comments: true,
          },
        },
      },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // Update view count
    await prisma.threadView.upsert({
      where: {
        threadId_ipAddress: {
          threadId: id,
          ipAddress: req.ip || 'unknown',
        },
      },
      create: {
        threadId: id,
        ipAddress: req.ip || 'unknown',
      },
      update: {
        viewedAt: new Date(),
      },
    });

    // Increment view count
    await prisma.thread.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({ thread });
  } catch (error) {
    console.error('Get thread failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new thread
router.post('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    console.log('Thread creation request body:', JSON.stringify(req.body, null, 2));
    
    const validatedData = createThreadSchema.parse(req.body);

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    // Validate bounty fields if bounty amount is provided
    if (validatedData.bountyAmount && validatedData.bountyAmount > 0) {
      if (!validatedData.bountyDescription) {
        res.status(400).json({ error: 'Bounty description is required when creating a bounty' });
        return;
      }
    }

    // Create thread with all fields
    const thread = await prisma.thread.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        urgency: validatedData.urgency,
        categoryId: validatedData.categoryId,
        authorId: req.user!.id,
        trlLevel: validatedData.trlLevel,
        domain: validatedData.domain,
        location: validatedData.location,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        isAnonymous: validatedData.isAnonymous,
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
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            solutions: true,
            comments: true,
          },
        },
      },
    });

    // Handle tags separately
    if (validatedData.tags && validatedData.tags.length > 0) {
      for (const tagName of validatedData.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: { usageCount: { increment: 1 } },
          create: { name: tagName, usageCount: 1 },
        });

        await prisma.threadTag.create({
          data: {
            threadId: thread.id,
            tagId: tag.id,
          },
        });
      }
    }

    // Create bounty if specified
    let bounty = null;
    if (validatedData.bountyAmount && validatedData.bountyAmount > 0) {
      bounty = await prisma.bounty.create({
        data: {
          threadId: thread.id,
          amount: validatedData.bountyAmount,
          currency: 'USD',
          description: validatedData.bountyDescription!,
          deadline: validatedData.bountyDeadline ? new Date(validatedData.bountyDeadline) : null,
          createdBy: req.user!.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
            }
          }
        }
      });
    }

    // Update user stats
    await trackThreadCreated(req.user!.id, thread.id, thread.title);

    // Prepare response with tags
    const threadWithTags = await prisma.thread.findUnique({
      where: { id: thread.id },
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
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        bounty: bounty ? {
          select: {
            id: true,
            amount: true,
            currency: true,
            description: true,
            deadline: true,
            isActive: true,
          }
        } : false,
        _count: {
          select: {
            solutions: true,
            comments: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Thread created successfully',
      thread: threadWithTags,
      bounty,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.errors, null, 2));
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Create thread failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update thread
router.put('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    
    const updateSchema = z.object({
      title: z.string().min(5).max(200).optional(),
      description: z.string().min(10).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED']).optional(),
      deadline: z.string().datetime().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Check if thread exists and user has permission
    const existingThread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!existingThread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    if (existingThread.authorId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'MODERATOR') {
      res.status(403).json({ error: 'Not authorized to update this thread' });
      return;
    }

    const sanitizedData = {
      ...validatedData,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
    };

    const thread = await prisma.thread.update({
      where: { id },
      data: sanitizedData,
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
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            solutions: true,
            comments: true,
          },
        },
      },
    });

    res.json({
      message: 'Thread updated successfully',
      thread,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Update thread failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete thread
router.delete('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if thread exists and user has permission
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    if (thread.authorId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'MODERATOR') {
      res.status(403).json({ error: 'Not authorized to delete this thread' });
      return;
    }

    // Delete thread (will cascade delete related records)
    await prisma.thread.delete({
      where: { id },
    });

    // Update user stats - decrement thread count
    await prisma.userStats.update({
      where: { userId: thread.authorId },
      data: {
        threadsCreated: { decrement: 1 },
      },
    });

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Delete thread failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vote on thread
router.post('/:id/vote', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['UPVOTE', 'DOWNVOTE'].includes(type)) {
      res.status(400).json({ error: 'Invalid vote type' });
      return;
    }

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: req.user!.id,
          targetId: id,
          targetType: 'thread',
        },
      },
    });

    let isNew = true;
    let wasOpposite = false;

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type clicked again
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });

        // Update thread vote count
        const updateData = type === 'UPVOTE' 
          ? { upvotes: { decrement: 1 } }
          : { downvotes: { decrement: 1 } };

        await prisma.thread.update({
          where: { id },
          data: updateData,
        });

        res.json({
          message: 'Vote removed',
          voteType: null,
        });
        return;
      } else {
        // Update vote type
        wasOpposite = true;
        isNew = false;
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });

        // Update thread vote counts (reverse previous and add new)
        const updateData = type === 'UPVOTE'
          ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
          : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };

        await prisma.thread.update({
          where: { id },
          data: updateData,
        });
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          userId: req.user!.id,
          targetId: id,
          targetType: 'thread',
          type,
        },
      });

      // Update thread vote count
      const updateData = type === 'UPVOTE' 
        ? { upvotes: { increment: 1 } }
        : { downvotes: { increment: 1 } };

      await prisma.thread.update({
        where: { id },
        data: updateData,
      });
    }

    // Track voting activity and update stats
    await trackVoteCreated(
      req.user!.id,
      thread.authorId,
      thread.id,
      'thread',
      type,
      isNew,
      wasOpposite
    );

    res.json({
      message: 'Vote recorded successfully',
      votes: { upvotes: thread.upvotes, downvotes: thread.downvotes },
    });
  } catch (error) {
    console.error('Vote failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a thread
router.get('/:id/comments', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // Get comments with replies
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          threadId: id,
          parentId: null, // Only get top-level comments
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
          replies: {
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
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { 
          threadId: id,
          parentId: null,
        },
      }),
    ]);

    // Transform comments to include vote information for current user
    const transformedComments = await Promise.all(
      comments.map(async (comment) => {
        let hasUserVoted = null;
        
        if (req.user) {
          const userVote = await prisma.vote.findUnique({
            where: {
              userId_targetId_targetType: {
                userId: req.user.id,
                targetId: comment.id,
                targetType: 'comment',
              },
            },
          });
          
          if (userVote) {
            hasUserVoted = userVote.type === 'UPVOTE' ? 'up' : 'down';
          }
        }

        // Transform replies similarly
        const transformedReplies = await Promise.all(
          comment.replies.map(async (reply) => {
            let replyHasUserVoted = null;
            
            if (req.user) {
              const userVote = await prisma.vote.findUnique({
                where: {
                  userId_targetId_targetType: {
                    userId: req.user.id,
                    targetId: reply.id,
                    targetType: 'comment',
                  },
                },
              });
              
              if (userVote) {
                replyHasUserVoted = userVote.type === 'UPVOTE' ? 'up' : 'down';
              }
            }

            return {
              ...reply,
              hasUserVoted: replyHasUserVoted,
              createdAt: reply.createdAt,
              editedAt: reply.editedAt,
            };
          })
        );

        return {
          ...comment,
          hasUserVoted,
          replies: transformedReplies,
          createdAt: comment.createdAt,
          editedAt: comment.editedAt,
        };
      })
    );

    res.json({
      comments: transformedComments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get thread comments failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a comment on a thread
router.post('/:id/comments', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ error: 'Comment content too long (max 2000 characters)' });
      return;
    }

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }

      if (parentComment.threadId !== id) {
        res.status(400).json({ error: 'Parent comment does not belong to this thread' });
        return;
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        authorId: req.user!.id,
        content: content.trim(),
        threadId: id,
        parentId: parentId || null,
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
        replies: true,
      },
    });

    // Update user stats
    await prisma.userStats.update({
      where: { userId: req.user!.id },
      data: {
        commentsPosted: { increment: 1 },
      },
    });

    // Track activity
    await trackCommentCreated(
      req.user!.id,
      thread.id,
      content
    );

    res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        ...comment,
        hasUserVoted: null,
        createdAt: comment.createdAt,
        editedAt: comment.editedAt,
      },
    });
  } catch (error) {
    console.error('Create thread comment failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activities for a thread
router.get('/:id/activities', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // Get activities for this thread
    const [activities, totalCount] = await Promise.all([
      prisma.threadActivity.findMany({
        where: { threadId: id },
        include: {
          user: {
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
              status: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.threadActivity.count({
        where: { threadId: id },
      }),
    ]);

    res.json({
      activities: activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        author: activity.user,
        timestamp: activity.timestamp,
        description: activity.description,
        metadata: activity.metadata,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get thread activities failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 