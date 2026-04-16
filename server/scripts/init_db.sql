-- Wipe existing tables for pure testing reset
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2.1 Geographic Hierarchy
CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    city_id TEXT REFERENCES cities(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.2 City Pricing Ledger (Updated by ML Server at City-Level)
CREATE TABLE IF NOT EXISTS city_pricing (
    city_id TEXT PRIMARY KEY REFERENCES cities(id) ON DELETE CASCADE,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 150.0,
    weekly_additional_price NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    weekly_reason TEXT,
    last_monthly_sync TIMESTAMP,
    last_weekly_sync TIMESTAMP
);

-- 2.2b ML Weekly Historical Logs
CREATE TABLE IF NOT EXISTS ml_weekly_context (
    id UUID PRIMARY KEY,
    city_id TEXT REFERENCES cities(id) ON DELETE CASCADE,
    rainfall_mm NUMERIC(10,2),
    temperature_avg NUMERIC(10,2),
    total_orders_weekly NUMERIC(10,2),
    disruption_freq_weekly NUMERIC(10,2),
    avg_disruption_duration_hrs NUMERIC(10,2),
    demand_stability_orders NUMERIC(10,2),
    holiday_flag INTEGER DEFAULT 0,
    event_flag INTEGER DEFAULT 0,
    city_tier INTEGER DEFAULT 1,
    city_rank INTEGER DEFAULT 1,
    median_income_weekly NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.3 Users / Workers
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY,
    platform_worker_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    city_id TEXT REFERENCES cities(id),
    zone_id TEXT REFERENCES zones(id),
    platform TEXT CHECK (platform IN ('ZEPTO','BLINKIT','SWIGGY')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.4 Wallet (DOUBLE ENTRY LEDGER)
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id UUID PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    type TEXT CHECK (type IN ('CREDIT','DEBIT')),
    category TEXT CHECK (
        category IN ('PREMIUM_PAYMENT','CLAIM_PAYOUT','TOPUP')
    ),
    reference_id UUID,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.5 Policies
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    city_id TEXT REFERENCES cities(id),
    status TEXT CHECK (status IN ('DRAFT','ACTIVE','EXPIRED')),
    premium_amount NUMERIC(10,2),
    coverage_multiplier NUMERIC(4,2),
    activated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.6 Claims
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    payout_amount NUMERIC(10,2),
    risk_score NUMERIC(4,2),
    severity_multiplier NUMERIC(4,2),
    disruption_type TEXT,
    status TEXT CHECK (status IN ('APPROVED','REJECTED','PENDING')),
    claim_type TEXT DEFAULT 'SYSTEM' CHECK (claim_type IN ('SYSTEM','MANUAL')),
    las_score NUMERIC(4,2),
    zone_id TEXT REFERENCES zones(id),
    claim_timeframe_start TIMESTAMP,
    claim_timeframe_end TIMESTAMP,
    claim_note TEXT,
    rejection_reason TEXT,
    client_request_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Idempotency index for manual claims
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_worker_client_request 
  ON claims (worker_id, client_request_id) 
  WHERE client_request_id IS NOT NULL;

-- 2.7 ML Inference Logs
CREATE TABLE IF NOT EXISTS ml_inference_logs (
    id UUID PRIMARY KEY,
    type TEXT,
    input JSONB,
    output JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.8 Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.9 Devices
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    fcm_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.10 Refresh Tokens (proper token rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup on token_hash
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_worker ON refresh_tokens(worker_id);

-- 2.11 Outbox Pattern
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY,
    event_type TEXT,
    payload JSONB,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.12 Low-Latency Granular Risk Snapshots (3 minute interval data)
CREATE TABLE IF NOT EXISTS zone_risk_snapshots (
    id UUID PRIMARY KEY,
    zone_id TEXT REFERENCES zones(id) ON DELETE CASCADE,
    risk_score NUMERIC(4,2),
    order_drop_percentage NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2.13 High-Latency Hourly Aggregation Logs
CREATE TABLE IF NOT EXISTS hourly_risk_analytics (
    id UUID PRIMARY KEY,
    zone_id TEXT REFERENCES zones(id) ON DELETE CASCADE,
    avg_risk_score NUMERIC(4,2),
    max_order_drop_percentage NUMERIC(5,2),
    hour_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DUMMY SEED DATA FOR TESTING (Hyderabad Zones)
INSERT INTO cities (id, name) VALUES ('C1', 'Hyderabad');
INSERT INTO zones (id, city_id, name) VALUES ('Z1', 'C1', 'Madhapur Dark Store');
INSERT INTO zones (id, city_id, name) VALUES ('Z2', 'C1', 'Kondapur Dark Store');
INSERT INTO zones (id, city_id, name) VALUES ('Z3', 'C1', 'Gachibowli Dark Store');
INSERT INTO zones (id, city_id, name) VALUES ('Z4', 'C1', 'Jubilee Hills Dark Store');
INSERT INTO zones (id, city_id, name) VALUES ('Z5', 'C1', 'Banjara Hills Dark Store');
INSERT INTO zones (id, city_id, name) VALUES ('Z6', 'C1', 'Hitec City Dark Store');
INSERT INTO city_pricing (city_id, base_price, weekly_additional_price) VALUES ('C1', 120.00, 15.50);
