import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import userRoutes from './routes/users.js';
import rewardRoutes from './routes/rewards.js';
import transactionRoutes from './routes/transactions.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import apiDocsRoutes from './routes/api-docs.js';
import { validateEnv } from './utils/validateEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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
  origin: 'http://localhost:5173',
  credentials: true
})); // Enable CORS for frontend
app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body

// Apply rate limiting to all routes
app.use('/api', apiLimiter);

// Routes
app.use('/api', userRoutes);
app.use('/api', rewardRoutes);
app.use('/api', transactionRoutes);
app.use('/api-docs', apiDocsRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api-docs`);
});
