import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import userRoutes from './routes/users.js';
import rewardRoutes from './routes/rewards.js';
import transactionRoutes from './routes/transactions.js';
import customerRoutes from './routes/customers.js';
import pointsRoutes from './routes/pointsRoutes.js';
import directPointsRoutes from './routes/directPoints.js';
import errorHandler from './middleware/errorHandler.js';
// Rate limiter removed
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import apiDocsRoutes from './routes/api-docs.js';
import { validateEnv } from './utils/validateEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';
import supportTicketRoutes from './routes/supportTickets.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import redeemRequestRoutes from './routes/redeemRequests.js';
import { fixAllUserTiers } from './utils/fixUserTiers.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Validate environment variables
validateEnv();

const app = express();

// Swagger setup
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.error('Error loading Swagger documentation:', error);
}

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://birewards.id' 
    : 'http://localhost:5173',
  credentials: true
})); // Enable CORS for frontend
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body

// Apply rate limiting to all routes
// Rate limiter removed - unlimited API requests allowed

// EMERGENCY FIX: Implement a request tracker to prevent infinite API calls
const requestTracker = new Map();

// COMPLETE FIX: Block ALL support ticket API calls that are causing infinite loops


// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Custom rate limiter for support tickets to prevent abuse
app.use('/api/support-tickets', (req, res, next) => {
  // Get a unique request identifier
  const path = req.path;
  const method = req.method;
  
  // Extract ticket ID from URL if available
  const pathSegments = path.split('/');
  const ticketId = pathSegments.length > 1 ? pathSegments[1] : 'all';
  
  // Create a key based on the specific endpoint being accessed
  const endpointKey = `${method}-${ticketId}-${pathSegments.length > 2 ? pathSegments[2] : 'main'}`;
  
  const now = Date.now();
  const lastRequest = requestTracker.get(endpointKey);
  
  // For any support ticket endpoint, enforce a 1 second cooldown period
  if (lastRequest && now - lastRequest < 1000) {
    console.log(`🛑 Blocking repeated request: ${method} ${path} (too frequent)`);
    return res.status(429).json({
      success: false,
      error: 'Request rate limited. Please wait before making another request.'
    });
  }
  
  // Update the tracker with this request
  requestTracker.set(endpointKey, now);
  console.log(`✅ Allowing request: ${method} ${path}`);
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) { 
    const expiryTime = now - 5000; // 5 seconds
    for (const [key, timestamp] of requestTracker.entries()) {
      if (timestamp < expiryTime) {
        requestTracker.delete(key);
      }
    }
  }
  
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api', rewardRoutes);
app.use('/api', transactionRoutes);
// app.use('/api', pointsRoutes); // Register the points routes
// app.use('/api', directPointsRoutes); // Register the direct points routes
app.use('/api-docs', apiDocsRoutes);
// app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', activityLogRoutes);
// app.use('/api/admin', adminRoutes); // Register the admin routes
// app.use('/api/redeem-requests', redeemRequestRoutes); // Register the redeem requests routes

// Serve uploads directory for profile images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api-docs`);
  
  // Fix all user tiers on startup
  try {
    console.log('Running automatic tier fix on startup...');
    const result = await fixAllUserTiers();
    console.log('Tier fix result:', result);
  } catch (error) {
    console.error('Error running tier fix on startup:', error);
  }
});
