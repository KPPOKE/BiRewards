// server.js (Versi Final & Bersih)

// 1. Muat Environment Variables TERLEBIH DAHULU
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// 2. Impor semua modul dan rute
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { errorHandler } from './middleware/errorHandler.js';
import { validateEnv } from './utils/validateEnv.js';
import { fixAllUserTiers } from './utils/fixUserTiers.js';

// Impor semua file rute Anda
import userRoutes from './routes/users.js';
import rewardRoutes from './routes/rewards.js';
import transactionRoutes from './routes/transactions.js';
import customerRoutes from './routes/customers.js';
import pointsRoutes from './routes/pointsRoutes.js';
import directPointsRoutes from './routes/directPoints.js';
import apiDocsRoutes from './routes/api-docs.js';
import supportTicketRoutes from './routes/supportTickets.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import redeemRequestRoutes from './routes/redeemRequests.js';

// 3. Validasi Environment & Inisialisasi Aplikasi
validateEnv();
const app = express();

// 4. Koneksi Database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 5. Setup Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://birewards.id' 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger setup
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.error('Error loading Swagger documentation:', error);
}

// 6. Pasang Semua Rute
app.use('/api/users', userRoutes);
app.use('/api', rewardRoutes);
app.use('/api', transactionRoutes);
app.use('/api', pointsRoutes); 
app.use('/api', directPointsRoutes);
app.use('/api-docs', apiDocsRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', activityLogRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/redeem-requests', redeemRequestRoutes); 

// 7. Error & 404 Handler (di bagian paling akhir)
app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', status: 404 }
  });
});

// 8. Jalankan Server setelah koneksi DB berhasil
const PORT = process.env.PORT || 3001;
pool.connect()
  .then(() => {
    console.log('✅ Database connected successfully!');
    app.listen(PORT, async () => {
      console.log(`🚀 Server berjalan di port ${PORT}`);
      try {
        console.log('Running automatic tier fix on startup...');
        await fixAllUserTiers();
        console.log('Tier fix completed.');
      } catch (error) {
        console.error('Error running tier fix on startup:', error);
      }
    });
  })
  .catch(err => {
    console.error('❌ FATAL: Gagal konek ke database. Server tidak akan berjalan.', err);
    process.exit(1);
  });

export { pool };
