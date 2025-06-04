"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVoteCreated = exports.trackCommentCreated = exports.trackSolutionCreated = exports.trackThreadCreated = exports.ActivityTracker = void 0;
const database_1 = require("../config/database");
const logger_1 = require("./logger");
class ActivityTracker {
    static async trackActivity(data) {
        try {
            if (data.threadId) {
                await database_1.prisma.threadActivity.create({
                    data: {
                        userId: data.userId,
                        threadId: data.threadId,
                        type: data.type,
                        description: data.description,
                        metadata: data.metadata || {},
                    }
                });
            }
            logger_1.logStructured.info('Activity tracked', {
                userId: data.userId,
                threadId: data.threadId,
                type: data.type
            });
        }
        catch (error) {
            logger_1.logStructured.error('Failed to track activity', error, {
                userId: data.userId,
                type: data.type
            });
        }
    }
    static async updateUserStats(updates) {
        try {
            for (const update of updates) {
                const { userId, field, increment, decrement } = update;
                const updateData = {};
                if (increment) {
                    updateData[field] = { increment };
                }
                else if (decrement) {
                    updateData[field] = { decrement };
                }
                await database_1.prisma.userStats.update({
                    where: { userId },
                    data: updateData
                });
            }
        }
        catch (error) {
            logger_1.logStructured.error('Failed to update user stats', error);
        }
    }
    static async trackActivityAndStats(activity, statsUpdates) {
        await Promise.all([
            this.trackActivity(activity),
            this.updateUserStats(statsUpdates)
        ]);
    }
    static async updateVoteStats(targetUserId, voteType, isNew, wasOpposite = false) {
        try {
            if (voteType === 'UPVOTE') {
                if (isNew) {
                    await database_1.prisma.userStats.update({
                        where: { userId: targetUserId },
                        data: { upvotesReceived: { increment: 1 } }
                    });
                }
                else if (wasOpposite) {
                    await database_1.prisma.userStats.update({
                        where: { userId: targetUserId },
                        data: { upvotesReceived: { increment: 1 } }
                    });
                }
            }
            else if (voteType === 'DOWNVOTE' && wasOpposite) {
                await database_1.prisma.userStats.update({
                    where: { userId: targetUserId },
                    data: { upvotesReceived: { decrement: 1 } }
                });
            }
        }
        catch (error) {
            logger_1.logStructured.error('Failed to update vote stats', error);
        }
    }
    static async updateSolutionAcceptanceStats(solutionAuthorId, threadAuthorId, isAccepted) {
        try {
            const increment = isAccepted ? 1 : -1;
            await Promise.all([
                database_1.prisma.userStats.update({
                    where: { userId: solutionAuthorId },
                    data: { solutionsAccepted: { increment } }
                }),
                this.trackActivity({
                    userId: solutionAuthorId,
                    type: isAccepted ? 'solution_accepted' : 'solution_rejected',
                    description: isAccepted
                        ? 'Your solution was accepted'
                        : 'Your solution acceptance was revoked',
                    metadata: { threadAuthorId }
                })
            ]);
        }
        catch (error) {
            logger_1.logStructured.error('Failed to update solution acceptance stats', error);
        }
    }
}
exports.ActivityTracker = ActivityTracker;
const trackThreadCreated = async (userId, threadId, threadTitle) => {
    await ActivityTracker.trackActivityAndStats({
        userId,
        threadId,
        type: 'thread_created',
        description: `Created thread: ${threadTitle}`,
        metadata: { threadTitle }
    }, [{ userId, field: 'threadsCreated', increment: 1 }]);
};
exports.trackThreadCreated = trackThreadCreated;
const trackSolutionCreated = async (userId, threadId, solutionTitle) => {
    await ActivityTracker.trackActivityAndStats({
        userId,
        threadId,
        type: 'solution_created',
        description: `Posted solution: ${solutionTitle}`,
        metadata: { solutionTitle }
    }, [{ userId, field: 'solutionsPosted', increment: 1 }]);
};
exports.trackSolutionCreated = trackSolutionCreated;
const trackCommentCreated = async (userId, threadId, commentContent) => {
    await ActivityTracker.trackActivityAndStats({
        userId,
        threadId,
        type: 'comment_created',
        description: 'Posted a comment',
        metadata: { contentPreview: commentContent.substring(0, 100) }
    }, [{ userId, field: 'commentsPosted', increment: 1 }]);
};
exports.trackCommentCreated = trackCommentCreated;
const trackVoteCreated = async (voterId, targetUserId, threadId, targetType, voteType, isNew, wasOpposite = false) => {
    if (threadId) {
        await ActivityTracker.trackActivity({
            userId: voterId,
            threadId,
            type: 'vote_cast',
            description: `${voteType.toLowerCase()}d a ${targetType}`,
            metadata: { targetType, voteType }
        });
    }
    await ActivityTracker.updateVoteStats(targetUserId, voteType, isNew, wasOpposite);
};
exports.trackVoteCreated = trackVoteCreated;
//# sourceMappingURL=activityTracker.js.map