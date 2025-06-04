import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase, healthCheck } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import threadRoutes from './routes/threads';
import solutionRoutes from './routes/solutions';
import userRoutes from './routes/users';
import commentRoutes from './routes/comments';
import fileRoutes from './routes/files';
import mediaRoutes from './routes/media';
import bountyRoutes from './routes/bounties';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Security middleware
app.use(helmet({
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

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('./uploads'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheck();
    const status = health.database && health.redis ? 200 : 503;
    
    res.status(status).json({
      status: status === 200 ? 'healthy' : 'unhealthy',
      ...health,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/threads', threadRoutes);
app.use('/api/v1/solutions', solutionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/bounties', bountyRoutes);

app.use('/graphql', (req, res) => {
  res.json({ message: 'GraphQL endpoint - will be configured with Apollo Server' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal Server Error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown handling
let server: any;

const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  }
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 DroneWERX Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 API: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 