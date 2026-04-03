import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import workerRoutes from './routes/workers';
import policyRoutes from './routes/policies';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/policies', policyRoutes);

// Basic health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: "UP",
      database: "UNKNOWN", // Will add db check later
    }
  });
});

app.use(errorHandler);

export default app;
