import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { pool } from './db';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database used for persistent mock state

// --- DATA ACCESS GET ENDPOINTS ---

// GET /weather?cityId=C1
app.get('/weather', async (req, res) => {
  const cityId = req.query.cityId as string;
  if (!cityId) return res.status(400).json({ error: 'cityId is required' });
  
  try {
    const result = await pool.query('SELECT * FROM mock_weather_states WHERE city_id = $1 ORDER BY timestamp DESC LIMIT 1', [cityId]);
    if (result.rows.length > 0) {
      return res.json({ cityId, ...result.rows[0], rainfall_mm: parseFloat(result.rows[0].rainfall_mm), temperature: parseFloat(result.rows[0].temperature) });
    }
    res.json({ cityId, rainfall_mm: 10, temperature: 28, condition: "CLEAR", extreme_alert: false, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /platform?zoneId=Z1
app.get('/platform', async (req, res) => {
  const zoneId = req.query.zoneId as string;
  if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
  
  try {
    const result = await pool.query('SELECT * FROM mock_platform_states WHERE zone_id = $1 ORDER BY timestamp DESC LIMIT 1', [zoneId]);
    if (result.rows.length > 0) {
      return res.json({ zoneId, ...result.rows[0], orderDropPercentage: parseFloat(result.rows[0].order_drop_percentage), avgDeliveryTime: result.rows[0].avg_delivery_time, totalOrders: result.rows[0].total_orders });
    }
    res.json({ zoneId, totalOrders: 1000, orderDropPercentage: 5, avgDeliveryTime: 15, status: "NORMAL", timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /platform/workers/:id
app.get('/platform/workers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('SELECT platform_worker_id as "platformWorkerId", name, platform, city_id as "cityId", zone_id as "zoneId", rating, mobile, is_online FROM platform_workers WHERE platform_worker_id = $1', [id]);
    if (result.rows.length > 0) return res.json(result.rows[0]);
    res.status(404).json({ error: 'Platform worker not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /platform/workers/:id/income-stats?hour=15
app.get('/platform/workers/:id/income-stats', async (req, res) => {
  const id = req.params.id;
  const hourStr = req.query.hour as string;
  const hour = hourStr ? parseInt(hourStr, 10) : new Date().getHours();
  
  try {
    // Generate a simulated but deterministic income rate per hour based on worker ID and hour
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Base income ranges from 80 to 200 depending on worker and time of day
    const timeMultiplier = (hour >= 18 && hour <= 21) ? 1.5 : ((hour >= 12 && hour <= 14) ? 1.2 : 1.0);
    const workerBase = 80 + (hash % 120);
    const hourlyIncome = Math.round(workerBase * timeMultiplier);

    res.json({ platformWorkerId: id, hour, hourlyAverageIncome: hourlyIncome });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /platform/workers/lookup  — auto-assign worker ID by email + mobile
// This simulates the platform API resolving a gig-worker identity
app.post('/platform/workers/lookup', async (req, res) => {
  const { email, mobile } = req.body as { email?: string; mobile?: string };
  if (!email || !mobile) {
    return res.status(400).json({ error: 'email and mobile are required' });
  }

  try {
    const result = await pool.query('SELECT platform_worker_id as "platformWorkerId", name, platform, city_id as "cityId", zone_id as "zoneId", rating, mobile FROM platform_workers WHERE mobile = $1', [mobile]);
    if (result.rows.length > 0) {
       return res.json({ ...result.rows[0], email, resolvedAt: new Date().toISOString() });
    }
    
    // Create new mock driver logic
    const newPlatformWorkerId = 'WRK-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
    const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'New Worker';
    const platformName = Math.random() > 0.5 ? 'ZEPTO' : 'BLINKIT';
    const cityId = 'C1';
    const zoneId = Math.random() > 0.5 ? 'Z1' : 'Z2';
    const rating = (4.0 + Math.random() * 1.0).toFixed(1);

    await pool.query(
      `INSERT INTO platform_workers (platform_worker_id, name, platform, city_id, zone_id, rating, mobile, is_online) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newPlatformWorkerId, name, platformName, cityId, zoneId, rating, mobile, true]
    );

    return res.json({
      platformWorkerId: newPlatformWorkerId,
      name,
      platform: platformName,
      cityId,
      zoneId,
      rating,
      mobile,
      email,
      resolvedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /platform/active-workers?zoneId=Z1
app.post('/platform/active-workers', async (req, res) => {
  const zoneId = req.query.zoneId as string;
  const workerIds = req.body.workerIds as string[];
  
  if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
  if (!Array.isArray(workerIds)) return res.status(400).json({ error: 'Body must contain an array of workerIds' });

  try {
    const result = await pool.query('SELECT platform_worker_id FROM platform_workers WHERE zone_id = $1 AND platform_worker_id = ANY($2)', [zoneId, workerIds]);
    const validWorkerIds = result.rows.map(r => r.platform_worker_id);
    
    // Mocking 80% of workers being currently "Online" navigating the platform natively
    const onlineWorkerIds = validWorkerIds.filter(() => Math.random() < 0.80);
    
    res.json({ zoneId, onlineWorkerIds, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /news?cityId=C1
app.get('/news', async (req, res) => {
  const cityId = req.query.cityId as string;
  if (!cityId) return res.status(400).json({ error: 'cityId is required' });
  
  try {
    const result = await pool.query('SELECT * FROM mock_news_states WHERE city_id = $1 ORDER BY timestamp DESC LIMIT 1', [cityId]);
    if (result.rows.length > 0) {
      return res.json({ cityId, headline: result.rows[0].headline, riskTag: result.rows[0].risk_tag, confidence: parseFloat(result.rows[0].confidence), events: result.rows[0].events, timestamp: result.rows[0].timestamp });
    }
    res.json({ cityId, headline: "Normal day in the city", riskTag: "NONE", confidence: 0.9, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /platform/outages?city=C1
app.get('/platform/outages', async (req, res) => {
  const cityId = (req.query.cityId || req.query.city) as string;
  if (!cityId) return res.status(400).json({ error: 'city is required' });
  
  try {
    const result = await pool.query('SELECT * FROM mock_platform_outages WHERE city_id = $1 ORDER BY timestamp DESC LIMIT 1', [cityId]);
    if (result.rows.length > 0) {
        return res.json({ metadata: { total_count: result.rows[0].total_count, avg_duration_hours: parseFloat(result.rows[0].avg_duration_hours) } });
    }
    res.json({ metadata: { total_count: 0, avg_duration_hours: 0 } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /traffic?zoneId=Z1
app.get('/traffic', async (req, res) => {
  const zoneId = req.query.zoneId as string;
  if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });
  
  try {
    const result = await pool.query('SELECT * FROM mock_traffic_states WHERE zone_id = $1 ORDER BY timestamp DESC LIMIT 1', [zoneId]);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return res.json({ zoneId, trafficRiskScore: parseFloat(row.traffic_risk_score), avgSpeed: row.avg_speed, incidentCount: row.incident_count, severityLevel: row.severity_level, timestamp: row.timestamp });
    }
    res.json({ trafficRiskScore: 0.1, avgSpeed: 45, incidentCount: 0, severityLevel: "LOW", timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN CONTROL POST ENDPOINTS ---

app.post('/admin/weather', async (req, res) => {
  const { cityId, rainfall_mm, condition, extreme_alert, temperature } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO mock_weather_states (city_id, rainfall_mm, temperature, condition, extreme_alert) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cityId, rainfall_mm ?? 150, temperature ?? 25, condition ?? "HEAVY_RAIN", extreme_alert ?? true]
    );
    res.json({ success: true, updated: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/platform', async (req, res) => {
  const { zoneId, orderDropPercentage, avgDeliveryTime, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO mock_platform_states (zone_id, total_orders, order_drop_percentage, avg_delivery_time, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [zoneId, 1200, orderDropPercentage ?? 80, avgDeliveryTime ?? 45, status ?? "DEGRADED"]
    );
    res.json({ success: true, updated: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/news', async (req, res) => {
  const { cityId, headline, riskTag } = req.body;
  
  const events = headline ? JSON.stringify([{ title: headline }]) : JSON.stringify([{ title: "City-wide strike announced" }]);
  try {
    const result = await pool.query(
      `INSERT INTO mock_news_states (city_id, headline, risk_tag, confidence, events) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cityId, headline ?? "City-wide strike announced", riskTag ?? "SOCIAL_DISRUPTION", 0.95, events]
    );
    res.json({ success: true, updated: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/traffic', async (req, res) => {
  const { zoneId, trafficRiskScore, avgSpeed, incidentCount, severityLevel } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO mock_traffic_states (zone_id, traffic_risk_score, avg_speed, incident_count, severity_level) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [zoneId, trafficRiskScore ?? 0.8, avgSpeed ?? 10, incidentCount ?? 1, severityLevel ?? "SEVERE"]
    );
    res.json({ success: true, updated: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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

// --- MOCK BANK API ---

// GET /bank/accounts — return list of mock bank accounts for the worker
app.get('/bank/accounts', (req, res) => {
    res.json({
        success: true,
        accounts: [
            { id: 'BANK-001', bankName: 'State Bank of India', accountEnding: '4521', type: 'Savings', ifsc: 'SBIN0001234' },
            { id: 'BANK-002', bankName: 'HDFC Bank', accountEnding: '8734', type: 'Current', ifsc: 'HDFC0005678' },
            { id: 'BANK-003', bankName: 'ICICI Bank', accountEnding: '1290', type: 'Savings', ifsc: 'ICIC0009012' },
            { id: 'BANK-004', bankName: 'Axis Bank', accountEnding: '6347', type: 'Savings', ifsc: 'UTIB0003456' },
        ]
    });
});

// POST /bank/pay — simulate a bank debit for premium payment
app.post('/bank/pay', (req, res) => {
    const { accountId, amount, reference } = req.body;
    if (!accountId || !amount) {
        return res.status(400).json({ success: false, error: 'accountId and amount are required' });
    }
    
    // Simulate processing delay
    const transactionId = 'TXN-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
    console.log(`[MockBank] Processed payment: ₹${amount} from account ${accountId} | TXN: ${transactionId} | Ref: ${reference || 'N/A'}`);
    
    res.json({
        success: true,
        transaction: {
            transactionId,
            accountId,
            amount: parseFloat(amount),
            status: 'COMPLETED',
            processedAt: new Date().toISOString(),
        }
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
