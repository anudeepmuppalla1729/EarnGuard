import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { pool } from './db';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// In-memory state for mocks
const state = {
  cities: {} as Record<string, any>,
  zones: {} as Record<string, any>
};

// --- DATA ACCESS GET ENDPOINTS ---

// GET /weather?cityId=C1
app.get('/weather', (req, res) => {
  const cityId = req.query.cityId as string;
  if (!cityId) return res.status(400).json({ error: 'cityId is required' });
  
  const data = state.cities[cityId]?.weather || {
    cityId,
    rainfall_mm: 10,
    temperature: 28,
    condition: "CLEAR",
    extreme_alert: false,
    timestamp: new Date().toISOString()
  };
  
  res.json(data);
});

// GET /platform?zoneId=Z1
app.get('/platform', (req, res) => {
  const zoneId = req.query.zoneId as string;
  if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
  
  const data = state.zones[zoneId]?.platform || {
    zoneId,
    totalOrders: 1000,
    orderDropPercentage: 5,
    avgDeliveryTime: 15,
    status: "NORMAL",
    timestamp: new Date().toISOString()
  };
  
  res.json(data);
});

// ── Curated mock driver pool (simulates platform database) ──────────────────
const CURATED_DRIVERS = [
  { platformWorkerId: 'WORKER-001', name: 'Rahul Verma',   platform: 'ZEPTO',   cityId: 'C1', zoneId: 'Z1', rating: 4.8, mobile: '9876543210', monthsActive: 14, avgWeeklyOrders: 87, weeklyEarnings: 9200 },
  { platformWorkerId: 'WORKER-002', name: 'Priya Singh',   platform: 'BLINKIT', cityId: 'C1', zoneId: 'Z2', rating: 4.9, mobile: '9876543211', monthsActive: 22, avgWeeklyOrders: 102, weeklyEarnings: 11400 },
  { platformWorkerId: 'WORKER-003', name: 'Anil Kumar',    platform: 'BLINKIT', cityId: 'C1', zoneId: 'Z1', rating: 4.2, mobile: '9876543212', monthsActive: 8,  avgWeeklyOrders: 65, weeklyEarnings: 7800 },
  { platformWorkerId: 'WORKER-004', name: 'Suresh Babu',   platform: 'ZEPTO',   cityId: 'C1', zoneId: 'Z2', rating: 4.6, mobile: '9876543213', monthsActive: 18, avgWeeklyOrders: 93, weeklyEarnings: 10500 },
  { platformWorkerId: 'WORKER-005', name: 'Deepa Nair',    platform: 'SWIGGY',  cityId: 'C1', zoneId: 'Z1', rating: 4.7, mobile: '9876543214', monthsActive: 31, avgWeeklyOrders: 110, weeklyEarnings: 12300 },
  { platformWorkerId: 'WORKER-006', name: 'Karthik Rajan', platform: 'ZEPTO',   cityId: 'C1', zoneId: 'Z2', rating: 4.5, mobile: '9876543215', monthsActive: 6,  avgWeeklyOrders: 58, weeklyEarnings: 6900 },
];

// GET /platform/workers/:id
app.get('/platform/workers/:id', (req, res) => {
  const id = req.params.id;
  const driver = CURATED_DRIVERS.find(d => d.platformWorkerId === id);
  if (driver) return res.json(driver);
  return res.status(404).json({ error: 'Platform worker not found' });
});

// POST /platform/workers/lookup  — auto-assign worker ID by email + mobile
// This simulates the platform API resolving a gig-worker identity without
// requiring the user to know their own worker ID.
app.post('/platform/workers/lookup', (req, res) => {
  const { email, mobile } = req.body as { email?: string; mobile?: string };

  if (!email || !mobile) {
    return res.status(400).json({ error: 'email and mobile are required' });
  }

  // Deterministically pick a curated driver based on the last digit of mobile
  // so the same mobile always resolves to the same profile (stable for demo)
  const lastDigit = parseInt(mobile.slice(-1), 10);
  const driver = CURATED_DRIVERS[lastDigit % CURATED_DRIVERS.length];

  // Return the curated profile — the platform "assigned" their worker ID
  return res.json({
    ...driver,
    email, // echo back so caller can verify
    resolvedAt: new Date().toISOString(),
  });
});

// POST /platform/active-workers?zoneId=Z1
app.post('/platform/active-workers', (req, res) => {
  const zoneId = req.query.zoneId as string;
  const workerIds = req.body.workerIds as string[];
  
  if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
  if (!Array.isArray(workerIds)) return res.status(400).json({ error: 'Body must contain an array of workerIds' });

  // Mocking 80% of workers being currently "Online" navigating the platform natively
  const onlineWorkerIds = workerIds.filter(() => Math.random() < 0.80);
  
  res.json({
    zoneId,
    onlineWorkerIds,
    timestamp: new Date().toISOString()
  });
});

// GET /news?cityId=C1
app.get('/news', (req, res) => {
  const cityId = req.query.cityId as string;
  if (!cityId) return res.status(400).json({ error: 'cityId is required' });
  
  const data = state.cities[cityId]?.news || {
    cityId,
    headline: "Normal day in the city",
    riskTag: "NONE",
    confidence: 0.9,
    timestamp: new Date().toISOString()
  };
  
  res.json(data);
});

// GET /traffic?zoneId=Z1
app.get('/traffic', (req, res) => {
  const zoneId = req.query.zoneId as string;
  if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
  
  const data = state.zones[zoneId]?.traffic || {
    trafficRiskScore: 0.1,
    avgSpeed: 45,
    incidentCount: 0,
    severityLevel: "LOW",
    timestamp: new Date().toISOString()
  };
  
  res.json(data);
});

// --- ADMIN CONTROL POST ENDPOINTS ---

app.post('/admin/weather', (req, res) => {
  const { cityId, rainfall_mm, condition, extreme_alert, temperature } = req.body;
  if (!state.cities[cityId]) state.cities[cityId] = {};
  
  state.cities[cityId].weather = {
    cityId,
    rainfall_mm: rainfall_mm ?? 150,
    condition: condition ?? "HEAVY_RAIN",
    extreme_alert: extreme_alert ?? true,
    temperature: temperature ?? 25,
    timestamp: new Date().toISOString()
  };
  
  res.json({ success: true, updated: state.cities[cityId].weather });
});

app.post('/admin/platform', (req, res) => {
  const { zoneId, orderDropPercentage, avgDeliveryTime, status } = req.body;
  if (!state.zones[zoneId]) state.zones[zoneId] = {};
  
  state.zones[zoneId].platform = {
    zoneId,
    orderDropPercentage: orderDropPercentage ?? 80,
    avgDeliveryTime: avgDeliveryTime ?? 45,
    status: status ?? "DEGRADED",
    totalOrders: 1200,
    timestamp: new Date().toISOString()
  };
  
  res.json({ success: true, updated: state.zones[zoneId].platform });
});

app.post('/admin/news', (req, res) => {
  const { cityId, headline, riskTag } = req.body;
  if (!state.cities[cityId]) state.cities[cityId] = {};
  
  state.cities[cityId].news = {
    cityId,
    headline: headline ?? "City-wide strike announced",
    riskTag: riskTag ?? "SOCIAL_DISRUPTION",
    confidence: 0.95,
    timestamp: new Date().toISOString()
  };
  
  res.json({ success: true, updated: state.cities[cityId].news });
});

app.post('/admin/traffic', (req, res) => {
  const { zoneId, trafficRiskScore, avgSpeed, incidentCount, severityLevel } = req.body;
  if (!state.zones[zoneId]) state.zones[zoneId] = {};
  
  state.zones[zoneId].traffic = {
    zoneId,
    trafficRiskScore: trafficRiskScore ?? 0.8,
    avgSpeed: avgSpeed ?? 10,
    incidentCount: incidentCount ?? 1,
    severityLevel: severityLevel ?? "SEVERE",
    timestamp: new Date().toISOString()
  };
  
  res.json({ success: true, updated: state.zones[zoneId].traffic });
});

// App Entry Point Hook
const PORT = process.env.PORT || 4000;

// --- NEW: Market/Economic Simulation for XGBoost Base Pipeline Context ---
app.get('/market', (req, res) => {
    // Generates simulated historical economic markers matching Python Training Data
    res.json({
        city_tier: Math.random() > 0.5 ? 1 : 2,
        city_rank: Math.floor(Math.random() * 5) + 1,
        median_income_weekly: parseFloat((8000 + Math.random() * 4000).toFixed(2)),
        demand_stability_orders: parseFloat((0.3 + Math.random() * 0.6).toFixed(2)),
        total_orders_weekly: Math.floor(1000 + Math.random() * 5000),
        holiday_flag: Math.random() > 0.9 ? 1 : 0,
        event_flag: Math.random() > 0.8 ? 1 : 0
    });
});

app.listen(PORT, async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log(`[Database] Connected to Mock PostgreSQL Database successfully.`);
    } catch (err) {
        console.error(`[Database] Failed to connect to Mock PostgreSQL Database:`, err);
    }
    console.log(`Mock Simulator Backend running on http://localhost:${PORT}`);
});
