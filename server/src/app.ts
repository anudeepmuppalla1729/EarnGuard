import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes          from './routes/auth';
import workerRoutes        from './routes/workers';
import policyRoutes        from './routes/policies';
import walletRoutes        from './routes/wallet';
import claimsRoutes        from './routes/claims';
import notificationRoutes  from './routes/notifications';
import dashboardRoutes     from './routes/dashboard';

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*', // allow Expo / mobile clients
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// ── Mount Routers ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth',           authRoutes);
app.use('/api/v1/workers',        workerRoutes);
app.use('/api/v1/policies',       policyRoutes);
app.use('/api/v1/wallet',         walletRoutes);
app.use('/api/v1/claims',         claimsRoutes);
app.use('/api/v1/notifications',  notificationRoutes);
app.use('/api/v1/dashboard',      dashboardRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: 'UP',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(errorHandler);

export default app;
