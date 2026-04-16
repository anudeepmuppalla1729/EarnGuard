-- Migration: Add manual claims support
-- Run this against the earnguard database

-- Add new columns to claims table for manual claim data
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_type TEXT DEFAULT 'SYSTEM' CHECK (claim_type IN ('SYSTEM','MANUAL'));
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_timeframe_start TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_timeframe_end TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_note TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS client_request_id TEXT;

-- Idempotency: unique constraint on (worker_id, client_request_id) for manual claims
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_worker_client_request 
  ON claims (worker_id, client_request_id) 
  WHERE client_request_id IS NOT NULL;

-- Index for efficient snapshot lookups by zone + time range
CREATE INDEX IF NOT EXISTS idx_zone_risk_snapshots_zone_time 
  ON zone_risk_snapshots (zone_id, created_at);
