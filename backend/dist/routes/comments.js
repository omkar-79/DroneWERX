"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const activityTracker_1 = require("../utils/activityTracker");
const router = express_1.default.Router();
router.post('/:id/vote', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        if (!['UPVOTE', 'DOWNVOTE'].includes(type)) {
            res.status(400).json({ error: 'Invalid vote type' });
            return;
        }
        const comment = await database_1.prisma.comment.findUnique({
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
        const existingVote = await database_1.prisma.vote.findUnique({
            where: {
                userId_targetId_targetType: {
                    userId: req.user.id,
                    targetId: id,
                    targetType: 'comment',
                },
            },
        });
        let isNew = true;
        let wasOpposite = false;
        if (existingVote) {
            if (existingVote.type === type) {
                await database_1.prisma.vote.delete({
                    where: { id: existingVote.id },
                });
                const updateData = type === 'UPVOTE'
                    ? { upvotes: { decrement: 1 } }
                    : { downvotes: { decrement: 1 } };
                await database_1.prisma.comment.update({
                    where: { id },
                    data: updateData,
                });
                res.json({
                    message: 'Vote removed',
                    voteType: null,
                });
                return;
            }
            else {
                wasOpposite = true;
                isNew = false;
                await database_1.prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { type },
                });
                const updateData = type === 'UPVOTE'
                    ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
                    : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } };
                await database_1.prisma.comment.update({
                    where: { id },
                    data: updateData,
                });
            }
        }
        else {
            await database_1.prisma.vote.create({
                data: {
                    userId: req.user.id,
                    targetId: id,
                    targetType: 'comment',
                    type,
                },
            });
            const updateData = type === 'UPVOTE'
                ? { upvotes: { increment: 1 } }
                : { downvotes: { increment: 1 } };
            await database_1.prisma.comment.update({
                where: { id },
                data: updateData,
            });
        }
        await (0, activityTracker_1.trackVoteCreated)(req.user.id, comment.authorId, comment.threadId || undefined, 'comment', type, isNew, wasOpposite);
        res.json({
            message: 'Vote recorded successfully',
            voteType: type.toLowerCase(),
        });
    }
    catch (error) {
        console.error('Comment vote failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
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
        const comment = await database_1.prisma.comment.findUnique({
            where: { id },
        });
        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }
        if (comment.authorId !== req.user.id) {
            res.status(403).json({ error: 'Not authorized to edit this comment' });
            return;
        }
        const updatedComment = await database_1.prisma.comment.update({
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
    }
    catch (error) {
        console.error('Update comment failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await database_1.prisma.comment.findUnique({
            where: { id },
        });
        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }
        if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
            res.status(403).json({ error: 'Not authorized to delete this comment' });
            return;
        }
        await database_1.prisma.comment.delete({
            where: { id },
        });
        await database_1.prisma.userStats.update({
            where: { userId: comment.authorId },
            data: {
                commentsPosted: { decrement: 1 },
            },
        });
        res.json({ message: 'Comment deleted successfully' });
    }
    catch (error) {
        console.error('Delete comment failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=comments.js.map