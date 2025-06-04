"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                bio: true,
                location: true,
                expertise: true,
                role: true,
                joinDate: true,
                lastLoginAt: true,
                serviceBranch: true,
                yearsOfService: true,
                deploymentHistory: true,
                securityClearance: true,
                stats: true,
                _count: {
                    select: {
                        threads: true,
                        solutions: true,
                        comments: true,
                    }
                }
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        logger_1.logStructured.error('Get user failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/threads', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [threads, totalCount] = await Promise.all([
            database_1.prisma.thread.findMany({
                where: { authorId: id },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    status: true,
                    urgency: true,
                    trlLevel: true,
                    views: true,
                    upvotes: true,
                    downvotes: true,
                    solutionCount: true,
                    commentCount: true,
                    createdAt: true,
                    updatedAt: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        }
                    },
                    tags: {
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true,
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            solutions: true,
                            comments: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.thread.count({
                where: { authorId: id }
            })
        ]);
        res.json({
            threads: threads.map(thread => ({
                ...thread,
                tags: thread.tags.map(t => t.tag)
            })),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Get user threads failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/solutions', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [solutions, totalCount] = await Promise.all([
            database_1.prisma.solution.findMany({
                where: { authorId: id },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    status: true,
                    trlLevel: true,
                    estimatedCost: true,
                    implementationTime: true,
                    upvotes: true,
                    downvotes: true,
                    isAccepted: true,
                    createdAt: true,
                    updatedAt: true,
                    thread: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        }
                    },
                    _count: {
                        select: {
                            comments: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.solution.count({
                where: { authorId: id }
            })
        ]);
        res.json({
            solutions,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Get user solutions failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const userStats = await database_1.prisma.userStats.findUnique({
            where: { userId: id }
        });
        if (!userStats) {
            res.status(404).json({ error: 'User stats not found' });
            return;
        }
        const [totalVotesReceived, totalSolutionsAccepted, threadViewsTotal, recentActivity] = await Promise.all([
            database_1.prisma.vote.count({
                where: {
                    type: 'UPVOTE',
                    OR: [
                        {
                            targetType: 'thread',
                            targetId: {
                                in: await database_1.prisma.thread.findMany({
                                    where: { authorId: id },
                                    select: { id: true }
                                }).then(threads => threads.map(t => t.id))
                            }
                        },
                        {
                            targetType: 'solution',
                            targetId: {
                                in: await database_1.prisma.solution.findMany({
                                    where: { authorId: id },
                                    select: { id: true }
                                }).then(solutions => solutions.map(s => s.id))
                            }
                        },
                        {
                            targetType: 'comment',
                            targetId: {
                                in: await database_1.prisma.comment.findMany({
                                    where: { authorId: id },
                                    select: { id: true }
                                }).then(comments => comments.map(c => c.id))
                            }
                        }
                    ]
                }
            }),
            database_1.prisma.solution.count({
                where: {
                    thread: { authorId: id },
                    isAccepted: true
                }
            }),
            database_1.prisma.thread.aggregate({
                where: { authorId: id },
                _sum: {
                    views: true
                }
            }),
            database_1.prisma.threadActivity.findMany({
                where: {
                    userId: id,
                    timestamp: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                select: {
                    type: true,
                    timestamp: true,
                },
                orderBy: { timestamp: 'desc' },
                take: 10,
            })
        ]);
        const stats = {
            ...userStats,
            totalVotesReceived,
            totalSolutionsAccepted,
            threadViewsTotal: threadViewsTotal._sum.views || 0,
            recentActivityCount: recentActivity.length,
            recentActivity,
        };
        res.json({ stats });
    }
    catch (error) {
        logger_1.logStructured.error('Get user stats failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/bookmarks', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type = 'all' } = req.query;
        const whereClause = { userId: id };
        if (type !== 'all') {
            whereClause.targetType = type === 'threads' ? 'thread' : type === 'users' ? 'user' : type;
        }
        const bookmarks = await database_1.prisma.bookmark.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        const threadIds = bookmarks.filter(b => b.targetType === 'thread').map(b => b.targetId);
        const userIds = bookmarks.filter(b => b.targetType === 'user').map(b => b.targetId);
        const solutionIds = bookmarks.filter(b => b.targetType === 'solution').map(b => b.targetId);
        const [threads, users, solutions] = await Promise.all([
            threadIds.length > 0 ? database_1.prisma.thread.findMany({
                where: { id: { in: threadIds } },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    status: true,
                    upvotes: true,
                    solutionCount: true,
                    createdAt: true,
                    author: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                        }
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        }
                    }
                }
            }) : [],
            userIds.length > 0 ? database_1.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                    bio: true,
                    role: true,
                    expertise: true,
                    stats: true,
                }
            }) : [],
            solutionIds.length > 0 ? database_1.prisma.solution.findMany({
                where: { id: { in: solutionIds } },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    upvotes: true,
                    isAccepted: true,
                    createdAt: true,
                    thread: {
                        select: {
                            id: true,
                            title: true,
                        }
                    },
                    author: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                        }
                    }
                }
            }) : []
        ]);
        res.json({
            bookmarks: {
                threads,
                users,
                solutions,
                count: {
                    threads: threads.length,
                    users: users.length,
                    solutions: solutions.length,
                    total: bookmarks.length,
                }
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Get user bookmarks failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/follow', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: targetUserId } = req.params;
        const followerId = req.user.id;
        if (targetUserId === followerId) {
            res.status(400).json({ error: 'Cannot follow yourself' });
            return;
        }
        const targetUser = await database_1.prisma.user.findUnique({
            where: { id: targetUserId }
        });
        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const existingFollow = await database_1.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: targetUserId
                }
            }
        });
        if (existingFollow) {
            await database_1.prisma.follow.delete({
                where: { id: existingFollow.id }
            });
            res.json({
                message: 'User unfollowed successfully',
                isFollowing: false
            });
        }
        else {
            await Promise.all([
                database_1.prisma.follow.create({
                    data: {
                        followerId,
                        followingId: targetUserId
                    }
                }),
                database_1.prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        type: 'MENTION',
                        title: 'New Follower',
                        message: `${req.user.username} started following you`,
                        data: {
                            followerId,
                            followerUsername: req.user.username,
                            type: 'follow'
                        }
                    }
                })
            ]);
            res.json({
                message: 'User followed successfully',
                isFollowing: true
            });
        }
    }
    catch (error) {
        logger_1.logStructured.error('Follow user failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/bookmark', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const { type } = req.body;
        const userId = req.user.id;
        if (!['thread', 'solution', 'user'].includes(type)) {
            res.status(400).json({ error: 'Invalid bookmark type' });
            return;
        }
        let targetExists = false;
        switch (type) {
            case 'thread':
                targetExists = !!(await database_1.prisma.thread.findUnique({ where: { id: targetId } }));
                break;
            case 'solution':
                targetExists = !!(await database_1.prisma.solution.findUnique({ where: { id: targetId } }));
                break;
            case 'user':
                targetExists = !!(await database_1.prisma.user.findUnique({ where: { id: targetId } }));
                break;
        }
        if (!targetExists) {
            res.status(404).json({ error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
            return;
        }
        const existingBookmark = await database_1.prisma.bookmark.findUnique({
            where: {
                userId_targetId_targetType: {
                    userId,
                    targetId,
                    targetType: type
                }
            }
        });
        if (existingBookmark) {
            await database_1.prisma.bookmark.delete({
                where: { id: existingBookmark.id }
            });
            res.json({
                message: 'Bookmark removed successfully',
                isBookmarked: false
            });
        }
        else {
            await database_1.prisma.bookmark.create({
                data: {
                    userId,
                    targetId,
                    targetType: type
                }
            });
            res.json({
                message: 'Bookmark added successfully',
                isBookmarked: true
            });
        }
    }
    catch (error) {
        logger_1.logStructured.error('Bookmark failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/followers', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [followers, totalCount] = await Promise.all([
            database_1.prisma.follow.findMany({
                where: { followingId: id },
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            bio: true,
                            role: true,
                            expertise: true,
                            stats: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.follow.count({
                where: { followingId: id }
            })
        ]);
        res.json({
            followers: followers.map(f => f.follower),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Get user followers failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/following', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [following, totalCount] = await Promise.all([
            database_1.prisma.follow.findMany({
                where: { followerId: id },
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            bio: true,
                            role: true,
                            expertise: true,
                            stats: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.follow.count({
                where: { followerId: id }
            })
        ]);
        res.json({
            following: following.map(f => f.following),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Get user following failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/badges', async (req, res) => {
    try {
        const { id } = req.params;
        const userStats = await database_1.prisma.userStats.findUnique({
            where: { userId: id }
        });
        if (!userStats) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const badges = [];
        if (userStats.threadsCreated >= 1) {
            badges.push({
                id: 'first-thread',
                name: 'First Thread',
                description: 'Created your first challenge thread',
                icon: '🎯',
                earnedAt: new Date(),
            });
        }
        if (userStats.threadsCreated >= 10) {
            badges.push({
                id: 'thread-creator',
                name: 'Thread Creator',
                description: 'Created 10 challenge threads',
                icon: '🏭',
                earnedAt: new Date(),
            });
        }
        if (userStats.solutionsAccepted >= 5) {
            badges.push({
                id: 'problem-solver',
                name: 'Problem Solver',
                description: 'Had 5 solutions accepted',
                icon: '🧠',
                earnedAt: new Date(),
            });
        }
        if (userStats.upvotesReceived >= 50) {
            badges.push({
                id: 'respected',
                name: 'Respected',
                description: 'Received 50 upvotes',
                icon: '⭐',
                earnedAt: new Date(),
            });
        }
        res.json({ badges });
    }
    catch (error) {
        logger_1.logStructured.error('Get user badges failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/', async (req, res) => {
    try {
        const { q, role, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const whereClause = {
            isActive: true,
        };
        if (q) {
            whereClause.OR = [
                { username: { contains: q, mode: 'insensitive' } },
                { fullName: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (role) {
            whereClause.role = role;
        }
        const [users, totalCount] = await Promise.all([
            database_1.prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                    bio: true,
                    location: true,
                    role: true,
                    expertise: true,
                    joinDate: true,
                    stats: true,
                },
                orderBy: { joinDate: 'desc' },
                skip,
                take: Number(limit),
            }),
            database_1.prisma.user.count({ where: whereClause })
        ]);
        res.json({
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / Number(limit)),
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Search users failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [activities, totalCount] = await Promise.all([
            database_1.prisma.threadActivity.findMany({
                where: { userId: id },
                include: {
                    thread: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.threadActivity.count({
                where: { userId: id }
            })
        ]);
        res.json({
            activities,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    }
    catch (error) {
        logger_1.logStructured.error('Get user activities failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        if (id !== userId) {
            res.status(403).json({ error: 'Forbidden: Can only update your own profile' });
            return;
        }
        const updateSchema = zod_1.z.object({
            fullName: zod_1.z.string().min(2).max(100).optional(),
            bio: zod_1.z.string().max(500).optional(),
            location: zod_1.z.string().max(100).optional(),
            expertise: zod_1.z.array(zod_1.z.string()).optional(),
            serviceBranch: zod_1.z.string().max(50).optional(),
            yearsOfService: zod_1.z.string().max(20).optional(),
            deploymentHistory: zod_1.z.string().max(200).optional(),
            securityClearance: zod_1.z.string().max(50).optional(),
        });
        const validatedData = updateSchema.parse(req.body);
        const user = await database_1.prisma.user.update({
            where: { id },
            data: validatedData,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                isVerified: true,
                avatar: true,
                bio: true,
                location: true,
                expertise: true,
                serviceBranch: true,
                yearsOfService: true,
                deploymentHistory: true,
                securityClearance: true,
                joinDate: true,
                lastLoginAt: true,
            },
        });
        logger_1.logStructured.info('User profile updated', { userId: id, username: req.user.username });
        res.json({
            message: 'Profile updated successfully',
            user,
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
        logger_1.logStructured.error('Update user profile failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map