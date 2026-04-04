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

-- 7. News States
CREATE TABLE IF NOT EXISTS mock_news_states (
    id SERIAL PRIMARY KEY,
    city_id TEXT REFERENCES mock_cities(city_id),
    headline TEXT DEFAULT 'Normal day in the city',
    risk_tag TEXT DEFAULT 'NONE',
    confidence NUMERIC(3,2) DEFAULT 0.9,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- SEED DATA
INSERT INTO mock_cities (city_id, name) VALUES ('C1', 'Hyderabad');

-- Safe Zone vs Risky Zone
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z1', 'C1', 'Madhapur Dark Store (Safe)');
INSERT INTO mock_zones (zone_id, city_id, name) VALUES ('Z2', 'C1', 'Kondapur Dark Store (Flood Risk)');

-- Fake Workers (Matching CURATED_DRIVERS)
INSERT INTO platform_workers (platform_worker_id, zone_id, city_id, platform, name, mobile, vehicle, rating)
VALUES 
('WORKER-001', 'Z1', 'C1', 'ZEPTO', 'Rahul Verma', '9876543210', 'Bike', 4.8),
('WORKER-002', 'Z2', 'C1', 'BLINKIT', 'Priya Singh', '9876543211', 'Scooter', 4.9),
('WORKER-003', 'Z1', 'C1', 'BLINKIT', 'Anil Kumar', '9876543212', 'Bike', 4.2),
('WORKER-004', 'Z2', 'C1', 'ZEPTO', 'Suresh Babu', '9876543213', 'Bike', 4.6),
('WORKER-005', 'Z1', 'C1', 'SWIGGY', 'Deepa Nair', '9876543214', 'Scooter', 4.7),
('WORKER-006', 'Z2', 'C1', 'ZEPTO', 'Karthik Rajan', '9876543215', 'Bike', 4.5);

-- Initial States (Z1 Safe, Z2 Risky example setup)
INSERT INTO mock_weather_states (city_id, rainfall_mm, condition) VALUES ('C1', 0, 'CLEAR');
INSERT INTO mock_traffic_states (zone_id, traffic_risk_score, severity_level) VALUES ('Z1', 0.1, 'LOW');
INSERT INTO mock_traffic_states (zone_id, traffic_risk_score, severity_level) VALUES ('Z2', 0.8, 'HIGH');
INSERT INTO mock_news_states (city_id) VALUES ('C1');
INSERT INTO mock_platform_states (zone_id) VALUES ('Z1');
INSERT INTO mock_platform_states (zone_id, order_drop_percentage, status) VALUES ('Z2', 85, 'DEGRADED');
