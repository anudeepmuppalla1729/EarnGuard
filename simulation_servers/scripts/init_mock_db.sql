-- Wipe existing tables for pure testing reset
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Mock Database setup for realistic API Simulation

-- 1. Mock Cities
CREATE TABLE IF NOT EXISTS mock_cities (
    city_id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. Mock Zones
CREATE TABLE IF NOT EXISTS mock_zones (
    zone_id TEXT PRIMARY KEY,
    city_id TEXT REFERENCES mock_cities(city_id),
    name TEXT NOT NULL
);

-- 3. Mock External Platform Workers (e.g. Zepto / Blinkit Drivers)
CREATE TABLE IF NOT EXISTS platform_workers (
    platform_worker_id TEXT PRIMARY KEY, -- ID given by Zepto/Blinkit
    zone_id TEXT REFERENCES mock_zones(zone_id),
    city_id TEXT REFERENCES mock_cities(city_id),
    platform TEXT CHECK (platform IN ('ZEPTO','BLINKIT','SWIGGY')),
    name TEXT NOT NULL,
    mobile TEXT,
    vehicle TEXT,
    rating NUMERIC(2,1) DEFAULT 4.5,
    is_online BOOLEAN DEFAULT false,
    active_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Weather Simulation States
CREATE TABLE IF NOT EXISTS mock_weather_states (
    id SERIAL PRIMARY KEY,
    city_id TEXT REFERENCES mock_cities(city_id),
    rainfall_mm NUMERIC(10,2) DEFAULT 0.0,
    temperature NUMERIC(4,1) DEFAULT 25.0,
    condition TEXT DEFAULT 'CLEAR',
    extreme_alert BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 5. Platform Outage States
CREATE TABLE IF NOT EXISTS mock_platform_states (
    id SERIAL PRIMARY KEY,
    zone_id TEXT REFERENCES mock_zones(zone_id),
    total_orders INTEGER DEFAULT 1000,
    order_drop_percentage NUMERIC(5,2) DEFAULT 0.0,
    avg_delivery_time INTEGER DEFAULT 15,
    status TEXT DEFAULT 'NORMAL',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 6. Traffic States
CREATE TABLE IF NOT EXISTS mock_traffic_states (
    id SERIAL PRIMARY KEY,
    zone_id TEXT REFERENCES mock_zones(zone_id),
    traffic_risk_score NUMERIC(4,2) DEFAULT 0.1,
    avg_speed INTEGER DEFAULT 45,
    incident_count INTEGER DEFAULT 0,
    severity_level TEXT DEFAULT 'LOW',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 6.5 Platform Outages
CREATE TABLE IF NOT EXISTS mock_platform_outages (
    id SERIAL PRIMARY KEY,
    city_id TEXT REFERENCES mock_cities(city_id),
    total_count INTEGER DEFAULT 0,
    avg_duration_hours NUMERIC(4,1) DEFAULT 0.0,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 7. News States
CREATE TABLE IF NOT EXISTS mock_news_states (
    id SERIAL PRIMARY KEY,
    city_id TEXT REFERENCES mock_cities(city_id),
    headline TEXT DEFAULT 'Normal day in the city',
    risk_tag TEXT DEFAULT 'NONE',
    confidence NUMERIC(3,2) DEFAULT 0.9,
    events JSONB DEFAULT '[]'::jsonb,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- SEED DATA
INSERT INTO mock_cities (city_id, name) VALUES ('C1', 'Hyderabad');

-- Safe Zone vs Risky Zone
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z1', 'C1', 'Madhapur Dark Store (Safe)');
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z2', 'C1', 'Kondapur Dark Store (Flood Risk)');
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z3', 'C1', 'Gachibowli Dark Store');
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z4', 'C1', 'Jubilee Hills Dark Store');
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z5', 'C1', 'Banjara Hills Dark Store');
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z6', 'C1', 'Hitec City Dark Store');   

-- Fake Workers (Matching CURATED_DRIVERS)
INSERT INTO platform_workers (platform_worker_id, zone_id, city_id, platform, name, mobile, vehicle, rating)
VALUES 
('WORKER-001', 'Z1', 'C1', 'ZEPTO', 'Rahul Verma', '9876543210', 'Bike', 4.8),
('WORKER-002', 'Z2', 'C1', 'BLINKIT', 'Priya Singh', '9876543211', 'Scooter', 4.9),
('WORKER-003', 'Z1', 'C1', 'BLINKIT', 'Anil Kumar', '9876543212', 'Bike', 4.2),
('WORKER-004', 'Z2', 'C1', 'ZEPTO', 'Suresh Babu', '9876543213', 'Bike', 4.6),
('WORKER-005', 'Z1', 'C1', 'SWIGGY', 'Deepa Nair', '9876543214', 'Scooter', 4.7),
('WORKER-006', 'Z2', 'C1', 'ZEPTO', 'Karthik Rajan', '9876543215', 'Bike', 4.5);

-- Initial States (Z1 Risky, Z2 Safe example setup for ML Demo)
INSERT INTO mock_weather_states (city_id, rainfall_mm, temperature, condition, extreme_alert) 
VALUES ('C1', 42.5, 26, 'HEAVY_RAIN', TRUE);

INSERT INTO mock_traffic_states (zone_id, traffic_risk_score, avg_speed, incident_count, severity_level) 
VALUES ('Z1', 0.75, 15, 3, 'HIGH');
INSERT INTO mock_traffic_states (zone_id, traffic_risk_score, avg_speed, incident_count, severity_level) 
VALUES ('Z2', 0.20, 35, 0, 'LOW');

INSERT INTO mock_news_states (city_id, headline, risk_tag, confidence, events) 
VALUES ('C1', 'Severe waterlogging reported near IT corridors.', 'WEATHER_IMPACT', 0.9, '[{"title": "Waterlogging at Madhapur junction causing severe traffic jams."}, {"title": "BlinkIt dark store experiences localized power outage."}]'::jsonb);

INSERT INTO mock_platform_states (zone_id, total_orders, order_drop_percentage, avg_delivery_time, status) 
VALUES ('Z1', 1540, 15, 42, 'DEGRADED');
INSERT INTO mock_platform_states (zone_id, total_orders, order_drop_percentage, avg_delivery_time, status) 
VALUES ('Z2', 1100, 4, 22, 'NORMAL');

INSERT INTO mock_platform_outages (city_id, total_count, avg_duration_hours)
VALUES ('C1', 2, 1.5);

