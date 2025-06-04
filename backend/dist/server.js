"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const threads_1 = __importDefault(require("./routes/threads"));
const solutions_1 = __importDefault(require("./routes/solutions"));
const users_1 = __importDefault(require("./routes/users"));
const comments_1 = __importDefault(require("./routes/comments"));
const files_1 = __importDefault(require("./routes/files"));
const media_1 = __importDefault(require("./routes/media"));
const bounties_1 = __importDefault(require("./routes/bounties"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4000;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use((0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static('./uploads'));
app.get('/health', async (req, res) => {
    try {
        const health = await (0, database_1.healthCheck)();
        const status = health.database && health.redis ? 200 : 503;
        res.status(status).json({
            status: status === 200 ? 'healthy' : 'unhealthy',
            ...health,
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: 'Health check failed',
        });
    }
});
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/threads', threads_1.default);
app.use('/api/v1/solutions', solutions_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/api/v1/comments', comments_1.default);
app.use('/api/v1/files', files_1.default);
app.use('/api/v1/media', media_1.default);
app.use('/api/v1/bounties', bounties_1.default);
app.use('/graphql', (req, res) => {
    res.json({ message: 'GraphQL endpoint - will be configured with Apollo Server' });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found on this server.',
        path: req.originalUrl,
    });
});
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(error.status || 500).json({
        error: isDevelopment ? error.message : 'Internal Server Error',
        ...(isDevelopment && { stack: error.stack }),
    });
});
let server;
const gracefulShutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    if (server) {
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    }
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 DroneWERX Backend running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 API: http://localhost:${PORT}/api/v1`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map