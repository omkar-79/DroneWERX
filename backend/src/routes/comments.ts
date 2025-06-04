import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { trackVoteCreated } from '../utils/activityTracker';

const router = express.Router();

// Vote on a comment
router.post('/:id/vote', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['UPVOTE', 'DOWNVOTE'].includes(type)) {
      res.status(400).json({ error: 'Invalid vote type' });
      return;
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        thread: true,
      },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: req.user!.id,
          targetId: id,
          targetType: 'comment',
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

        // Update comment vote count
        const updateData = type === 'UPVOTE' 
          ? { upvotes: { decrement: 1 } }
          : { downvotes: { decrement: 1 } };

        await prisma.comment.update({
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

        // Update comment vote counts (reverse previous and add new)
        const updateData = type === 'UPVOTE'
          ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
          : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };

        await prisma.comment.update({
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
          targetType: 'comment',
          type,
        },
      });

      // Update comment vote count
      const updateData = type === 'UPVOTE' 
        ? { upvotes: { increment: 1 } }
        : { downvotes: { increment: 1 } };

      await prisma.comment.update({
        where: { id },
        data: updateData,
      });
    }

    // Track voting activity
    await trackVoteCreated(
      req.user!.id,
      comment.authorId,
      comment.threadId || undefined,
      'comment',
      type,
      isNew,
      wasOpposite
    );

    res.json({
      message: 'Vote recorded successfully',
      voteType: type.toLowerCase(),
    });
  } catch (error) {
    console.error('Comment vote failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ error: 'Comment content too long (max 2000 characters)' });
      return;
    }

    // Check if comment exists and user has permission
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to edit this comment' });
      return;
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
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
      },
    });

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    });
  } catch (error) {
    console.error('Update comment failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if comment exists and user has permission
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'MODERATOR') {
      res.status(403).json({ error: 'Not authorized to delete this comment' });
      return;
    }

    // Delete comment (will cascade delete replies)
    await prisma.comment.delete({
      where: { id },
    });

    // Update user stats - decrement comment count
    await prisma.userStats.update({
      where: { userId: comment.authorId },
      data: {
        commentsPosted: { decrement: 1 },
      },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 