"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const activityTracker_1 = require("../utils/activityTracker");
const router = express_1.default.Router();
const createThreadSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(200),
    description: zod_1.z.string().min(10).max(2000),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    urgency: zod_1.z.enum(['ROUTINE', 'PRIORITY', 'IMMEDIATE', 'FLASH']).default('ROUTINE'),
    categoryId: zod_1.z.string().uuid(),
    tags: zod_1.z.array(zod_1.z.string()).max(10).default([]),
    trlLevel: zod_1.z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
    domain: zod_1.z.string().max(100).optional(),
    location: zod_1.z.string().max(100).optional(),
    deadline: zod_1.z.string().datetime().optional(),
    isAnonymous: zod_1.z.boolean().default(false),
    bountyAmount: zod_1.z.number().positive().optional(),
    bountyDescription: zod_1.z.string().min(10).max(500).optional(),
    bountyDeadline: zod_1.z.string().datetime().optional(),
    isClassified: zod_1.z.boolean().default(false),
    requiredClearance: zod_1.z.string().max(50).optional(),
});
const updateThreadSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(200).optional(),
    description: zod_1.z.string().min(10).max(2000).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(10).optional(),
    bountyAmount: zod_1.z.number().positive().optional(),
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED']).optional(),
    isClassified: zod_1.z.boolean().optional(),
    requiredClearance: zod_1.z.string().max(50).optional(),
    deadline: zod_1.z.string().datetime().optional(),
});
const querySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).default('1'),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).default('20'),
    search: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    tag: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['created', 'updated', 'priority', 'bounty', 'votes']).default('created'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    authorId: zod_1.z.string().uuid().optional(),
});
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const category = req.query.category;
        const status = req.query.status;
        const priority = req.query.priority;
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (category) {
            whereClause.categoryId = category;
        }
        if (status) {
            whereClause.status = status.toUpperCase();
        }
        if (priority) {
            whereClause.priority = priority.toUpperCase();
        }
        const threads = await database_1.prisma.thread.findMany({
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
        const total = await database_1.prisma.thread.count({ where: whereClause });
        res.json({
            threads,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get threads failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/categories', async (req, res) => {
    try {
        const categories = await database_1.prisma.category.findMany({
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
    }
    catch (error) {
        console.error('Get categories failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/tags', async (req, res) => {
    try {
        const tags = await database_1.prisma.tag.findMany({
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
            take: 50,
        });
        res.json({
            tags,
            total: tags.length,
        });
    }
    catch (error) {
        console.error('Get tags failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await database_1.prisma.thread.findUnique({
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
        await database_1.prisma.threadView.upsert({
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
        await database_1.prisma.thread.update({
            where: { id },
            data: { views: { increment: 1 } },
        });
        res.json({ thread });
    }
    catch (error) {
        console.error('Get thread failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('Thread creation request body:', JSON.stringify(req.body, null, 2));
        const validatedData = createThreadSchema.parse(req.body);
        const category = await database_1.prisma.category.findUnique({
            where: { id: validatedData.categoryId },
        });
        if (!category) {
            res.status(400).json({ error: 'Invalid category' });
            return;
        }
        if (validatedData.bountyAmount && validatedData.bountyAmount > 0) {
            if (!validatedData.bountyDescription) {
                res.status(400).json({ error: 'Bounty description is required when creating a bounty' });
                return;
            }
        }
        const thread = await database_1.prisma.thread.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                priority: validatedData.priority,
                urgency: validatedData.urgency,
                categoryId: validatedData.categoryId,
                authorId: req.user.id,
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
        if (validatedData.tags && validatedData.tags.length > 0) {
            for (const tagName of validatedData.tags) {
                const tag = await database_1.prisma.tag.upsert({
                    where: { name: tagName },
                    update: { usageCount: { increment: 1 } },
                    create: { name: tagName, usageCount: 1 },
                });
                await database_1.prisma.threadTag.create({
                    data: {
                        threadId: thread.id,
                        tagId: tag.id,
                    },
                });
            }
        }
        let bounty = null;
        if (validatedData.bountyAmount && validatedData.bountyAmount > 0) {
            bounty = await database_1.prisma.bounty.create({
                data: {
                    threadId: thread.id,
                    amount: validatedData.bountyAmount,
                    currency: 'USD',
                    description: validatedData.bountyDescription,
                    deadline: validatedData.bountyDeadline ? new Date(validatedData.bountyDeadline) : null,
                    createdBy: req.user.id,
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
        await (0, activityTracker_1.trackThreadCreated)(req.user.id, thread.id, thread.title);
        const threadWithTags = await database_1.prisma.thread.findUnique({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateSchema = zod_1.z.object({
            title: zod_1.z.string().min(5).max(200).optional(),
            description: zod_1.z.string().min(10).optional(),
            priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
            status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED']).optional(),
            deadline: zod_1.z.string().datetime().optional(),
        });
        const validatedData = updateSchema.parse(req.body);
        const existingThread = await database_1.prisma.thread.findUnique({
            where: { id },
        });
        if (!existingThread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (existingThread.authorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
            res.status(403).json({ error: 'Not authorized to update this thread' });
            return;
        }
        const sanitizedData = {
            ...validatedData,
            deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
        };
        const thread = await database_1.prisma.thread.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await database_1.prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (thread.authorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
            res.status(403).json({ error: 'Not authorized to delete this thread' });
            return;
        }
        await database_1.prisma.thread.delete({
            where: { id },
        });
        await database_1.prisma.userStats.update({
            where: { userId: thread.authorId },
            data: {
                threadsCreated: { decrement: 1 },
            },
        });
        res.json({ message: 'Thread deleted successfully' });
    }
    catch (error) {
        console.error('Delete thread failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/vote', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        if (!['UPVOTE', 'DOWNVOTE'].includes(type)) {
            res.status(400).json({ error: 'Invalid vote type' });
            return;
        }
        const thread = await database_1.prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        const existingVote = await database_1.prisma.vote.findUnique({
            where: {
                userId_targetId_targetType: {
                    userId: req.user.id,
                    targetId: id,
                    targetType: 'thread',
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
                await database_1.prisma.thread.update({
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
                await database_1.prisma.thread.update({
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
                    targetType: 'thread',
                    type,
                },
            });
            const updateData = type === 'UPVOTE'
                ? { upvotes: { increment: 1 } }
                : { downvotes: { increment: 1 } };
            await database_1.prisma.thread.update({
                where: { id },
                data: updateData,
            });
        }
        await (0, activityTracker_1.trackVoteCreated)(req.user.id, thread.authorId, thread.id, 'thread', type, isNew, wasOpposite);
        res.json({
            message: 'Vote recorded successfully',
            votes: { upvotes: thread.upvotes, downvotes: thread.downvotes },
        });
    }
    catch (error) {
        console.error('Vote failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const thread = await database_1.prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        const [comments, totalCount] = await Promise.all([
            database_1.prisma.comment.findMany({
                where: {
                    threadId: id,
                    parentId: null,
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
            database_1.prisma.comment.count({
                where: {
                    threadId: id,
                    parentId: null,
                },
            }),
        ]);
        const transformedComments = await Promise.all(comments.map(async (comment) => {
            let hasUserVoted = null;
            if (req.user) {
                const userVote = await database_1.prisma.vote.findUnique({
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
            const transformedReplies = await Promise.all(comment.replies.map(async (reply) => {
                let replyHasUserVoted = null;
                if (req.user) {
                    const userVote = await database_1.prisma.vote.findUnique({
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
            }));
            return {
                ...comment,
                hasUserVoted,
                replies: transformedReplies,
                createdAt: comment.createdAt,
                editedAt: comment.editedAt,
            };
        }));
        res.json({
            comments: transformedComments,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    }
    catch (error) {
        console.error('Get thread comments failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/comments', auth_1.authenticateToken, async (req, res) => {
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
        const thread = await database_1.prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (parentId) {
            const parentComment = await database_1.prisma.comment.findUnique({
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
        const comment = await database_1.prisma.comment.create({
            data: {
                authorId: req.user.id,
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
        await database_1.prisma.userStats.update({
            where: { userId: req.user.id },
            data: {
                commentsPosted: { increment: 1 },
            },
        });
        await (0, activityTracker_1.trackCommentCreated)(req.user.id, thread.id, content);
        res.status(201).json({
            message: 'Comment created successfully',
            comment: {
                ...comment,
                hasUserVoted: null,
                createdAt: comment.createdAt,
                editedAt: comment.editedAt,
            },
        });
    }
    catch (error) {
        console.error('Create thread comment failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const thread = await database_1.prisma.thread.findUnique({
            where: { id },
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        const [activities, totalCount] = await Promise.all([
            database_1.prisma.threadActivity.findMany({
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
            database_1.prisma.threadActivity.count({
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
    }
    catch (error) {
        console.error('Get thread activities failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=threads.js.map