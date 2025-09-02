import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { setupWebSocket } from './websocket/socket.js';
import { setupBullBoard } from './queue/bullBoard.js';

// Import routes
import authRoutes from './routes/auth.js';
import touristRoutes from './routes/tourist.js';
import emergencyRoutes from './routes/emergency.js';
import policeRoutes from './routes/police.js';
import blockchainRoutes from './routes/blockchain.js';
import paymentRoutes from './routes/payment.js';
import notificationRoutes from './routes/notification.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

// Import services
import { initializeBlockchain } from './services/blockchain.js';
import { initializeRedis } from './services/redis.js';
import { initializeEmailService } from './services/email.js';
import { initializeSMSService } from './services/sms.js';
import { initializeStorage } from './services/storage.js';
import { initializePaymentService } from './services/payment.js';
import { initializeAIService } from './services/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize services
let redis, emailService, smsService, storageService, paymentService, aiService, blockchainService;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all requests
app.use(limiter);

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
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    process.env.ADMIN_URL || "http://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    message: 'Travel Safe Shield API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tourist: '/api/tourist',
      emergency: '/api/emergency',
      police: '/api/police',
      blockchain: '/api/blockchain',
      payment: '/api/payment',
      notification: '/api/notification',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tourist', authMiddleware, touristRoutes);
app.use('/api/emergency', authMiddleware, emergencyRoutes);
app.use('/api/police', authMiddleware, policeRoutes);
app.use('/api/blockchain', authMiddleware, blockchainRoutes);
app.use('/api/payment', authMiddleware, paymentRoutes);
app.use('/api/notification', authMiddleware, notificationRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Setup Bull Board for job monitoring
setupBullBoard(app);

// Setup WebSocket
setupWebSocket(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize all services
async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Initialize Redis
    redis = await initializeRedis();
    logger.info('Redis initialized successfully');
    
    // Initialize Blockchain
    blockchainService = await initializeBlockchain();
    logger.info('Blockchain service initialized successfully');
    
    // Initialize Email Service
    emailService = await initializeEmailService();
    logger.info('Email service initialized successfully');
    
    // Initialize SMS Service
    smsService = await initializeSMSService();
    logger.info('SMS service initialized successfully');
    
    // Initialize Storage Service
    storageService = await initializeStorage();
    logger.info('Storage service initialized successfully');
    
    // Initialize Payment Service
    paymentService = await initializePaymentService();
    logger.info('Payment service initialized successfully');
    
    // Initialize AI Service
    aiService = await initializeAIService();
    logger.info('AI service initialized successfully');
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Travel Safe Shield Backend Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`🔧 Bull Board: http://localhost:${PORT}/admin/queues`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export services for use in other modules
export { redis, emailService, smsService, storageService, paymentService, aiService, blockchainService };

startServer();
