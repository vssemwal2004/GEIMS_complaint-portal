/**
 * Main Application Entry Point
 * 
 * GEIMS Complaint Portal Backend
 * A production-ready complaint management system with security best practices.
 * 
 * Security Features:
 * - Helmet for HTTP security headers
 * - CORS configuration
 * - Rate limiting
 * - Input validation & sanitization
 * - NoSQL injection prevention
 * - XSS protection
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST (explicit .env path, override OS env vars)
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
dotenv.config({ path: envPath, override: true });

// Import database connection
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

// Import middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

// Import utilities
import seedAdmin from './utils/seedAdmin.js';
import { verifyTransporter } from './config/email.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Configuration
const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Helmet - Sets various HTTP headers for security
// Protects against well-known web vulnerabilities
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS - Cross-Origin Resource Sharing
// Only allow requests from frontend URL
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting for all API routes
// Protects against DDoS and brute force attacks
app.use('/api', apiLimiter);

// ===========================================
// BODY PARSING MIDDLEWARE
// ===========================================

// Parse JSON bodies (limit to prevent large payload attacks)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// Sanitize data to prevent NoSQL injection
// Removes $ and . from req.body, req.query, req.params
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized ${key} in request from ${req.ip}`);
  },
}));

// ===========================================
// LOGGING MIDDLEWARE
// ===========================================

// HTTP request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Production logging format
  app.use(morgan('combined'));
}

// ===========================================
// STATIC FILES
// ===========================================

// Serve uploaded files
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// ===========================================
// HEALTH CHECK ROUTES
// ===========================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'GEIMS Complaint Portal API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ===========================================
// API ROUTES
// ===========================================

// Authentication routes (login, logout, password change)
app.use('/api/auth', authRoutes);

// Admin routes (student management, complaint review)
app.use('/api/admin', adminRoutes);

// Student routes (complaint submission, viewing)
app.use('/api/student', studentRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===========================================
// SERVER STARTUP
// ===========================================

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Seed admin user if not exists
    await seedAdmin();

    // Verify email transporter in non-development environments only
    // to avoid noisy errors when SMTP is not available locally.
    if (NODE_ENV !== 'development') {
      verifyTransporter();
    }

    // Create uploads directory if not exists
    const fs = await import('fs/promises');
    try {
      await fs.access(uploadsPath);
    } catch {
      await fs.mkdir(uploadsPath, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 GEIMS Complaint Portal API`);
      console.log(`📍 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      console.log('='.repeat(50));
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  // Close server gracefully
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Start the server
startServer();

export default app;

