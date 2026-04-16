import { Router } from 'express';
import { adminAuth } from '../middlewares/adminAuth';
import * as c from '../controllers/adminController';

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/login', c.login);

// ── Protected ────────────────────────────────────────────────────────────────
router.use(adminAuth);

// System
router.get('/health',          c.getHealth);
router.get('/metrics',         c.getMetrics);

// Risk
router.get('/risk/overview',   c.getRiskOverview);
router.get('/events',          c.getActiveEvents);

// Claims
router.get('/claims/summary',  c.getClaimsSummary);
router.get('/claims',          c.getClaimsDetail);

// Fraud
router.get('/fraud',           c.getFraudInsights);

// Payouts
router.get('/payouts',         c.getPayoutStats);

// Queues
router.get('/queues',          c.getQueueStats);

// ML
router.get('/ml/metrics',      c.getMlMetrics);
router.get('/pricing',         c.getPricing);

// Debug
router.get('/signals',         c.getSignals);

// Users
router.get('/users',           c.getUsers);

// Simulation Control
router.post('/simulate/weather',  c.simulateWeather);
router.post('/simulate/platform', c.simulatePlatform);
router.post('/simulate/news',     c.simulateNews);
router.post('/simulate/traffic',  c.simulateTraffic);

export default router;
