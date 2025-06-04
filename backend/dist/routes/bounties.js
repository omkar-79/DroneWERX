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
const createBountySchema = zod_1.z.object({
    threadId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive().min(1),
    currency: zod_1.z.string().min(3).max(3).default('USD'),
    description: zod_1.z.string().min(10).max(500),
    deadline: zod_1.z.string().datetime().optional(),
});
const updateBountySchema = zod_1.z.object({
    amount: zod_1.z.number().positive().min(1).optional(),
    description: zod_1.z.string().min(10).max(500).optional(),
    deadline: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().optional(),
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = createBountySchema.parse(req.body);
        const thread = await database_1.prisma.thread.findUnique({
            where: { id: validatedData.threadId },
            include: { bounty: true }
        });
        if (!thread) {
            res.status(404).json({ error: 'Thread not found' });
            return;
        }
        if (thread.bounty) {
            res.status(400).json({ error: 'Thread already has a bounty' });
            return;
        }
        if (thread.authorId !== req.user.id) {
            res.status(403).json({ error: 'Only thread author can create a bounty' });
            return;
        }
        if (thread.status !== 'OPEN') {
            res.status(400).json({ error: 'Can only add bounty to open threads' });
            return;
        }
        const bounty = await database_1.prisma.bounty.create({
            data: {
                threadId: validatedData.threadId,
                amount: validatedData.amount,
                currency: validatedData.currency,
                description: validatedData.description,
                deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
                createdBy: req.user.id,
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
        logger_1.logStructured.info('Bounty created', {
            bountyId: bounty.id,
            threadId: validatedData.threadId,
            amount: validatedData.amount,
            currency: validatedData.currency,
            createdBy: req.user.id,
        });
        res.status(201).json({
            message: 'Bounty created successfully',
            bounty,
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
        logger_1.logStructured.error('Create bounty failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const bounty = await database_1.prisma.bounty.findUnique({
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
    }
    catch (error) {
        logger_1.logStructured.error('Get bounty failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/thread/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const bounty = await database_1.prisma.bounty.findUnique({
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
    }
    catch (error) {
        logger_1.logStructured.error('Get thread bounty failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateBountySchema.parse(req.body);
        const existingBounty = await database_1.prisma.bounty.findUnique({
            where: { id },
            include: { thread: true }
        });
        if (!existingBounty) {
            res.status(404).json({ error: 'Bounty not found' });
            return;
        }
        if (existingBounty.createdBy !== req.user.id) {
            res.status(403).json({ error: 'Only bounty creator can update bounty' });
            return;
        }
        if (existingBounty.winnerId) {
            res.status(400).json({ error: 'Cannot update bounty after it has been awarded' });
            return;
        }
        const updatedBounty = await database_1.prisma.bounty.update({
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
        logger_1.logStructured.info('Bounty updated', {
            bountyId: id,
            updatedBy: req.user.id,
            changes: validatedData,
        });
        res.json({
            message: 'Bounty updated successfully',
            bounty: updatedBounty,
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
        logger_1.logStructured.error('Update bounty failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/award', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { solutionId } = req.body;
        if (!solutionId) {
            res.status(400).json({ error: 'Solution ID is required' });
            return;
        }
        const bounty = await database_1.prisma.bounty.findUnique({
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
        if (bounty.thread.authorId !== req.user.id) {
            res.status(403).json({ error: 'Only thread author can award bounty' });
            return;
        }
        if (bounty.winnerId) {
            res.status(400).json({ error: 'Bounty has already been awarded' });
            return;
        }
        const solution = await database_1.prisma.solution.findUnique({
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
        if (solution.authorId === bounty.thread.authorId) {
            res.status(400).json({ error: 'Cannot award bounty to your own solution' });
            return;
        }
        const updatedBounty = await database_1.prisma.bounty.update({
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
        await database_1.prisma.solution.update({
            where: { id: solutionId },
            data: { isAccepted: true }
        });
        await database_1.prisma.thread.update({
            where: { id: bounty.threadId },
            data: {
                status: 'SOLVED',
                isAcceptedSolution: true,
                acceptedSolutionId: solutionId,
            }
        });
        logger_1.logStructured.info('Bounty awarded', {
            bountyId: id,
            winnerId: solution.authorId,
            solutionId,
            amount: bounty.amount,
            awardedBy: req.user.id,
        });
        res.json({
            message: 'Bounty awarded successfully',
            bounty: updatedBounty,
        });
    }
    catch (error) {
        logger_1.logStructured.error('Award bounty failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const bounty = await database_1.prisma.bounty.findUnique({
            where: { id }
        });
        if (!bounty) {
            res.status(404).json({ error: 'Bounty not found' });
            return;
        }
        if (bounty.createdBy !== req.user.id) {
            res.status(403).json({ error: 'Only bounty creator can cancel bounty' });
            return;
        }
        if (bounty.winnerId) {
            res.status(400).json({ error: 'Cannot cancel bounty after it has been awarded' });
            return;
        }
        await database_1.prisma.bounty.update({
            where: { id },
            data: { isActive: false }
        });
        logger_1.logStructured.info('Bounty cancelled', {
            bountyId: id,
            cancelledBy: req.user.id,
        });
        res.json({ message: 'Bounty cancelled successfully' });
    }
    catch (error) {
        logger_1.logStructured.error('Cancel bounty failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const isActive = req.query.isActive === 'true';
        const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount) : undefined;
        const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined;
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (isActive !== undefined) {
            whereClause.isActive = isActive;
        }
        if (minAmount !== undefined || maxAmount !== undefined) {
            whereClause.amount = {};
            if (minAmount !== undefined)
                whereClause.amount.gte = minAmount;
            if (maxAmount !== undefined)
                whereClause.amount.lte = maxAmount;
        }
        const [bounties, total] = await Promise.all([
            database_1.prisma.bounty.findMany({
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
            database_1.prisma.bounty.count({ where: whereClause })
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
    }
    catch (error) {
        logger_1.logStructured.error('Get bounties failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=bounties.js.map