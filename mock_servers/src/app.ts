import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

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

app.listen(PORT, () => {
    console.log(`Mock Simulator Backend running on http://localhost:${PORT}`);
});
