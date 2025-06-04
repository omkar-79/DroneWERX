import { prisma } from '../config/database';
import { logStructured } from './logger';

export interface ActivityData {
  userId: string;
  threadId?: string;
  type: string;
  description: string;
  metadata?: any;
}

export interface StatsUpdate {
  userId: string;
  field: 'threadsCreated' | 'solutionsPosted' | 'commentsPosted' | 'upvotesReceived' | 'solutionsAccepted';
  increment?: number;
  decrement?: number;
}

export class ActivityTracker {
  // Track user activity and create ThreadActivity record
  static async trackActivity(data: ActivityData): Promise<void> {
    try {
      // Only create ThreadActivity if threadId is provided
      if (data.threadId) {
        await prisma.threadActivity.create({
          data: {
            userId: data.userId,
            threadId: data.threadId,
            type: data.type,
            description: data.description,
            metadata: data.metadata || {},
          }
        });
      }
      
      logStructured.info('Activity tracked', {
        userId: data.userId,
        threadId: data.threadId,
        type: data.type
      });
    } catch (error) {
      logStructured.error('Failed to track activity', error as Error, {
        userId: data.userId,
        type: data.type
      });
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Update user statistics
  static async updateUserStats(updates: StatsUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        const { userId, field, increment, decrement } = update;
        
        const updateData: any = {};
        if (increment) {
          updateData[field] = { increment };
        } else if (decrement) {
          updateData[field] = { decrement };
        }

        await prisma.userStats.update({
          where: { userId },
          data: updateData
        });
      }
    } catch (error) {
      logStructured.error('Failed to update user stats', error as Error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Combined method to track activity and update stats
  static async trackActivityAndStats(
    activity: ActivityData, 
    statsUpdates: StatsUpdate[]
  ): Promise<void> {
    await Promise.all([
      this.trackActivity(activity),
      this.updateUserStats(statsUpdates)
    ]);
  }

  // Update vote-related statistics
  static async updateVoteStats(
    targetUserId: string, 
    voteType: 'UPVOTE' | 'DOWNVOTE',
    isNew: boolean,
    wasOpposite: boolean = false
  ): Promise<void> {
    try {
      if (voteType === 'UPVOTE') {
        if (isNew) {
          // New upvote
          await prisma.userStats.update({
            where: { userId: targetUserId },
            data: { upvotesReceived: { increment: 1 } }
          });
        } else if (wasOpposite) {
          // Changed from downvote to upvote (net +2)
          await prisma.userStats.update({
            where: { userId: targetUserId },
            data: { upvotesReceived: { increment: 1 } }
          });
        }
      } else if (voteType === 'DOWNVOTE' && wasOpposite) {
        // Changed from upvote to downvote
        await prisma.userStats.update({
          where: { userId: targetUserId },
          data: { upvotesReceived: { decrement: 1 } }
        });
      }
    } catch (error) {
      logStructured.error('Failed to update vote stats', error as Error);
    }
  }

  // Update solution acceptance statistics
  static async updateSolutionAcceptanceStats(
    solutionAuthorId: string,
    threadAuthorId: string,
    isAccepted: boolean
  ): Promise<void> {
    try {
      const increment = isAccepted ? 1 : -1;
      
      await Promise.all([
        // Update solution author's accepted solutions count
        prisma.userStats.update({
          where: { userId: solutionAuthorId },
          data: { solutionsAccepted: { increment } }
        }),
        
        // Track activity for solution author
        this.trackActivity({
          userId: solutionAuthorId,
          type: isAccepted ? 'solution_accepted' : 'solution_rejected',
          description: isAccepted 
            ? 'Your solution was accepted' 
            : 'Your solution acceptance was revoked',
          metadata: { threadAuthorId }
        })
      ]);
    } catch (error) {
      logStructured.error('Failed to update solution acceptance stats', error as Error);
    }
  }
}

// Helper functions for common activities
export const trackThreadCreated = async (userId: string, threadId: string, threadTitle: string) => {
  await ActivityTracker.trackActivityAndStats(
    {
      userId,
      threadId,
      type: 'thread_created',
      description: `Created thread: ${threadTitle}`,
      metadata: { threadTitle }
    },
    [{ userId, field: 'threadsCreated', increment: 1 }]
  );
};

export const trackSolutionCreated = async (userId: string, threadId: string, solutionTitle: string) => {
  await ActivityTracker.trackActivityAndStats(
    {
      userId,
      threadId,
      type: 'solution_created',
      description: `Posted solution: ${solutionTitle}`,
      metadata: { solutionTitle }
    },
    [{ userId, field: 'solutionsPosted', increment: 1 }]
  );
};

export const trackCommentCreated = async (userId: string, threadId: string, commentContent: string) => {
  await ActivityTracker.trackActivityAndStats(
    {
      userId,
      threadId,
      type: 'comment_created',
      description: 'Posted a comment',
      metadata: { contentPreview: commentContent.substring(0, 100) }
    },
    [{ userId, field: 'commentsPosted', increment: 1 }]
  );
};

export const trackVoteCreated = async (
  voterId: string, 
  targetUserId: string, 
  threadId: string | undefined,
  targetType: string,
  voteType: 'UPVOTE' | 'DOWNVOTE',
  isNew: boolean,
  wasOpposite: boolean = false
) => {
  // Track activity for voter if threadId is available
  if (threadId) {
    await ActivityTracker.trackActivity({
      userId: voterId,
      threadId,
      type: 'vote_cast',
      description: `${voteType.toLowerCase()}d a ${targetType}`,
      metadata: { targetType, voteType }
    });
  }

  // Update vote statistics for target user
  await ActivityTracker.updateVoteStats(targetUserId, voteType, isNew, wasOpposite);
}; 