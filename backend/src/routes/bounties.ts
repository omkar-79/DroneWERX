import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createBountySchema = z.object({
  threadId: z.string().uuid(),
  amount: z.number().positive().min(1),
  currency: z.string().min(3).max(3).default('USD'),
  description: z.string().min(10).max(500),
  deadline: z.string().datetime().transform((date) => new Date(date)).optional(),
});

const updateBountySchema = z.object({
  amount: z.number().positive().min(1).optional(),
  description: z.string().min(10).max(500).optional(),
  deadline: z.string().datetime().transform((date) => new Date(date)).optional(),
  isActive: z.boolean().optional(),
});

// Create a bounty for a thread
router.post('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const validatedData = createBountySchema.parse(req.body);

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: validatedData.threadId },
      include: { bounty: true }
    });

    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    // Check if thread already has a bounty
    if (thread.bounty) {
      res.status(400).json({ error: 'Thread already has a bounty' });
      return;
    }

    // Only thread author can create bounty for their thread
    if (thread.authorId !== req.user!.id) {
      res.status(403).json({ error: 'Only thread author can create a bounty' });
      return;
    }

    // Thread must be open to add bounty
    if (thread.status !== 'OPEN') {
      res.status(400).json({ error: 'Can only add bounty to open threads' });
      return;
    }

    // Create the bounty
    const bounty = await prisma.bounty.create({
      data: {
        threadId: validatedData.threadId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        description: validatedData.description,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        createdBy: req.user!.id,
      },
      include: {
        thread: {
          select: {
            id: true,
            title: true,
            authorId: true,
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          }
        }
      }
    });

    logStructured.info('Bounty created', {
      bountyId: bounty.id,
      threadId: validatedData.threadId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      message: 'Bounty created successfully',
      bounty,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    logStructured.error('Create bounty failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bounty details
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: {
        thread: {
          select: {
            id: true,
            title: true,
            status: true,
            authorId: true,
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        },
        winner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        }
      }
    });

    if (!bounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }

    res.json({ bounty });
  } catch (error) {
    logStructured.error('Get bounty failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bounty for a specific thread
router.get('/thread/:threadId', async (req, res): Promise<void> => {
  try {
    const { threadId } = req.params;

    const bounty = await prisma.bounty.findUnique({
      where: { threadId },
      include: {
        thread: {
          select: {
            id: true,
            title: true,
            status: true,
            authorId: true,
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        },
        winner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        }
      }
    });

    if (!bounty) {
      res.status(404).json({ error: 'No bounty found for this thread' });
      return;
    }

    res.json({ bounty });
  } catch (error) {
    logStructured.error('Get thread bounty failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bounty (only by creator before it's awarded)
router.put('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateBountySchema.parse(req.body);

    const existingBounty = await prisma.bounty.findUnique({
      where: { id },
      include: { thread: true }
    });

    if (!existingBounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }

    // Only bounty creator can update
    if (existingBounty.createdBy !== req.user!.id) {
      res.status(403).json({ error: 'Only bounty creator can update bounty' });
      return;
    }

    // Cannot update if bounty has been awarded
    if (existingBounty.winnerId) {
      res.status(400).json({ error: 'Cannot update bounty after it has been awarded' });
      return;
    }

    // Update bounty
    const updatedBounty = await prisma.bounty.update({
      where: { id },
      data: {
        ...validatedData,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
      },
      include: {
        thread: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          }
        }
      }
    });

    logStructured.info('Bounty updated', {
      bountyId: id,
      updatedBy: req.user!.id,
      changes: validatedData,
    });

    res.json({
      message: 'Bounty updated successfully',
      bounty: updatedBounty,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    logStructured.error('Update bounty failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Award bounty to a solution
router.post('/:id/award', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { solutionId } = req.body;

    if (!solutionId) {
      res.status(400).json({ error: 'Solution ID is required' });
      return;
    }

    const bounty = await prisma.bounty.findUnique({
      where: { id },
      include: {
        thread: true,
        creator: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    if (!bounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }

    // Only thread author can award bounty
    if (bounty.thread.authorId !== req.user!.id) {
      res.status(403).json({ error: 'Only thread author can award bounty' });
      return;
    }

    // Check if bounty has already been awarded
    if (bounty.winnerId) {
      res.status(400).json({ error: 'Bounty has already been awarded' });
      return;
    }

    // Verify solution exists and belongs to the thread
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId },
      include: {
        author: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    if (!solution) {
      res.status(404).json({ error: 'Solution not found' });
      return;
    }

    if (solution.threadId !== bounty.threadId) {
      res.status(400).json({ error: 'Solution does not belong to bounty thread' });
      return;
    }

    // Cannot award bounty to thread author's own solution
    if (solution.authorId === bounty.thread.authorId) {
      res.status(400).json({ error: 'Cannot award bounty to your own solution' });
      return;
    }

    // Award the bounty
    const updatedBounty = await prisma.bounty.update({
      where: { id },
      data: {
        winnerId: solution.authorId,
        isActive: false,
      },
      include: {
        thread: {
          select: { id: true, title: true }
        },
        creator: {
          select: { id: true, username: true, fullName: true }
        },
        winner: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    // Mark solution as accepted
    await prisma.solution.update({
      where: { id: solutionId },
      data: { isAccepted: true }
    });

    // Update thread status
    await prisma.thread.update({
      where: { id: bounty.threadId },
      data: {
        status: 'SOLVED',
        isAcceptedSolution: true,
        acceptedSolutionId: solutionId,
      }
    });

    // TODO: Create notification for bounty winner
    // TODO: Update user stats/badges

    logStructured.info('Bounty awarded', {
      bountyId: id,
      winnerId: solution.authorId,
      solutionId,
      amount: bounty.amount,
      awardedBy: req.user!.id,
    });

    res.json({
      message: 'Bounty awarded successfully',
      bounty: updatedBounty,
    });
  } catch (error) {
    logStructured.error('Award bounty failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel/deactivate bounty (only by creator, before awarding)
router.delete('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const bounty = await prisma.bounty.findUnique({
      where: { id }
    });

    if (!bounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }

    // Only bounty creator can cancel
    if (bounty.createdBy !== req.user!.id) {
      res.status(403).json({ error: 'Only bounty creator can cancel bounty' });
      return;
    }

    // Cannot cancel if already awarded
    if (bounty.winnerId) {
      res.status(400).json({ error: 'Cannot cancel bounty after it has been awarded' });
      return;
    }

    // Deactivate bounty instead of deleting (for audit trail)
    await prisma.bounty.update({
      where: { id },
      data: { isActive: false }
    });

    logStructured.info('Bounty cancelled', {
      bountyId: id,
      cancelledBy: req.user!.id,
    });

    res.json({ message: 'Bounty cancelled successfully' });
  } catch (error) {
    logStructured.error('Cancel bounty failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bounties (with filtering)
router.get('/', async (req, res): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isActive = req.query.isActive === 'true';
    const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
    const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {};
      if (minAmount !== undefined) whereClause.amount.gte = minAmount;
      if (maxAmount !== undefined) whereClause.amount.lte = maxAmount;
    }

    const [bounties, total] = await Promise.all([
      prisma.bounty.findMany({
        where: whereClause,
        include: {
          thread: {
            select: {
              id: true,
              title: true,
              status: true,
              category: {
                select: { name: true, color: true }
              }
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            }
          },
          winner: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { amount: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.bounty.count({ where: whereClause })
    ]);

    res.json({
      bounties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    logStructured.error('Get bounties failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 