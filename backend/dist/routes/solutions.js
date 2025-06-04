"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("../config/database");
const security_1 = require("../config/security");
const auth_1 = require("../middleware/auth");
const activityTracker_1 = require("../utils/activityTracker");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = security_1.SECURITY_CONFIG.FILE_UPLOAD.UPLOAD_PATH;
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const sanitizedName = security_1.InputSanitizer.sanitizeFileName(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: security_1.SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE,
        files: 20
    },
    fileFilter: (req, file, cb) => {
        if (security_1.SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});
const createSolutionSchema = zod_1.z.object({
    threadId: zod_1.z.string().uuid(),
    description: zod_1.z.string().min(10).max(2000),
    costEstimate: zod_1.z.number().positive().optional(),
    timelineEstimate: zod_1.z.string().max(100).optional(),
    trlLevel: zod_1.z.number().min(1).max(9).optional(),
    technicalSpecs: zod_1.z.string().max(1000).optional(),
    implementationPlan: zod_1.z.string().max(1000).optional(),
    riskAssessment: zod_1.z.string().max(1000).optional(),
});
const updateSolutionSchema = zod_1.z.object({
    description: zod_1.z.string().min(10).max(2000).optional(),
    costEstimate: zod_1.z.number().positive().optional(),
    timelineEstimate: zod_1.z.string().max(100).optional(),
    trlLevel: zod_1.z.number().min(1).max(9).optional(),
    technicalSpecs: zod_1.z.string().max(1000).optional(),
    implementationPlan: zod_1.z.string().max(1000).optional(),
    riskAssessment: zod_1.z.string().max(1000).optional(),
    status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
});
router.get('/thread/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const whereClause = {
            threadId,
        };
        if (status) {
            whereClause.status = status.toUpperCase();
        }
        const solutions = await database_1.prisma.solution.findMany({
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
        const total = await database_1.prisma.solution.count({ where: whereClause });
        res.json({
            solutions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get solutions failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const solution = await database_1.prisma.solution.findUnique({
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
    }
    catch (error) {
        console.error('Get solution failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const createSchema = zod_1.z.object({
            threadId: zod_1.z.string().uuid(),
            title: zod_1.z.string().min(5).max(200),
            content: zod_1.z.string().min(10),
            technicalSpecs: zod_1.z.string().optional(),
            implementationPlan: zod_1.z.string().optional(),
            riskAssessment: zod_1.z.string().optional(),
            estimatedCost: zod_1.z.number().optional(),
            implementationTime: zod_1.z.string().optional(),
            trlLevel: zod_1.z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
        });
        const validatedData = createSchema.parse(req.body);
        const thread = await database_1.prisma.thread.findUnique({
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
        const solution = await database_1.prisma.solution.create({
            data: {
                ...validatedData,
                authorId: req.user.id,
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
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
        await database_1.prisma.thread.update({
            where: { id: validatedData.threadId },
            data: { solutionCount: { increment: 1 } },
        });
        await (0, activityTracker_1.trackSolutionCreated)(req.user.id, validatedData.threadId, solution.title);
        res.status(201).json({
            message: 'Solution created successfully',
            solution,
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
        console.error('Create solution failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/with-media', auth_1.authenticateToken, upload.any(), async (req, res) => {
    try {
        const createSchema = zod_1.z.object({
            threadId: zod_1.z.string().uuid(),
            title: zod_1.z.string().min(5).max(200),
            content: zod_1.z.string().min(10),
            technicalSpecs: zod_1.z.string().optional(),
            implementationPlan: zod_1.z.string().optional(),
            riskAssessment: zod_1.z.string().optional(),
            estimatedCost: zod_1.z.coerce.number().optional(),
            implementationTime: zod_1.z.string().optional(),
            trlLevel: zod_1.z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
        });
        const validatedData = createSchema.parse(req.body);
        const thread = await database_1.prisma.thread.findUnique({
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
        const solution = await database_1.prisma.solution.create({
            data: {
                ...validatedData,
                authorId: req.user.id,
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
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
        const files = req.files;
        if (files && files.length > 0) {
            const attachmentData = files.map(file => ({
                solutionId: solution.id,
                originalName: file.originalname,
                filename: file.filename,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/${file.filename}`,
                uploadedBy: req.user.id,
                isImage: file.mimetype.startsWith('image/'),
                isVideo: file.mimetype.startsWith('video/'),
                isDocument: !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/'),
            }));
            await database_1.prisma.attachment.createMany({
                data: attachmentData,
            });
        }
        await database_1.prisma.thread.update({
            where: { id: validatedData.threadId },
            data: { solutionCount: { increment: 1 } },
        });
        await (0, activityTracker_1.trackSolutionCreated)(req.user.id, validatedData.threadId, solution.title);
        const completeSolution = await database_1.prisma.solution.findUnique({
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
    }
    catch (error) {
        const files = req.files;
        if (files) {
            files.forEach(file => {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
        }
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateSchema = zod_1.z.object({
            title: zod_1.z.string().min(5).max(200).optional(),
            content: zod_1.z.string().min(10).optional(),
            technicalSpecs: zod_1.z.string().optional(),
            implementationPlan: zod_1.z.string().optional(),
            riskAssessment: zod_1.z.string().optional(),
            status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
            estimatedCost: zod_1.z.number().optional(),
            implementationTime: zod_1.z.string().optional(),
            trlLevel: zod_1.z.enum(['TRL1', 'TRL2', 'TRL3', 'TRL4', 'TRL5', 'TRL6', 'TRL7', 'TRL8', 'TRL9']).optional(),
        });
        const validatedData = updateSchema.parse(req.body);
        const existingSolution = await database_1.prisma.solution.findUnique({
            where: { id },
            include: { thread: true },
        });
        if (!existingSolution) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }
        if (existingSolution.authorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
            res.status(403).json({ error: 'Not authorized to update this solution' });
            return;
        }
        const sanitizedData = Object.fromEntries(Object.entries(validatedData).filter(([_, value]) => value !== undefined));
        const solution = await database_1.prisma.solution.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const solution = await database_1.prisma.solution.findUnique({
            where: { id },
            include: { thread: true },
        });
        if (!solution) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }
        if (solution.authorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
            res.status(403).json({ error: 'Not authorized to delete this solution' });
            return;
        }
        await database_1.prisma.solution.delete({
            where: { id },
        });
        await database_1.prisma.thread.update({
            where: { id: solution.threadId },
            data: { solutionCount: { decrement: 1 } },
        });
        await database_1.prisma.userStats.update({
            where: { userId: solution.authorId },
            data: {
                solutionsPosted: { decrement: 1 },
            },
        });
        res.json({ message: 'Solution deleted successfully' });
    }
    catch (error) {
        console.error('Delete solution failed:', error);
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
        const solution = await database_1.prisma.solution.findUnique({
            where: { id },
            include: { thread: true },
        });
        if (!solution) {
            res.status(404).json({ error: 'Solution not found' });
            return;
        }
        const existingVote = await database_1.prisma.vote.findUnique({
            where: {
                userId_targetId_targetType: {
                    userId: req.user.id,
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
            wasOpposite = true;
            isNew = false;
            await database_1.prisma.vote.update({
                where: { id: existingVote.id },
                data: { type },
            });
        }
        else {
            await database_1.prisma.vote.create({
                data: {
                    userId: req.user.id,
                    targetId: id,
                    targetType: 'solution',
                    type,
                },
            });
        }
        const votes = await database_1.prisma.vote.groupBy({
            by: ['type'],
            where: {
                targetId: id,
                targetType: 'solution',
            },
            _count: true,
        });
        const upvotes = votes.find(v => v.type === 'UPVOTE')?._count || 0;
        const downvotes = votes.find(v => v.type === 'DOWNVOTE')?._count || 0;
        await database_1.prisma.solution.update({
            where: { id },
            data: {
                upvotes,
                downvotes,
            },
        });
        await (0, activityTracker_1.trackVoteCreated)(req.user.id, solution.authorId, solution.threadId, 'solution', type, isNew, wasOpposite);
        res.json({
            message: 'Vote recorded successfully',
            votes: { upvotes, downvotes },
        });
    }
    catch (error) {
        console.error('Vote failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=solutions.js.map