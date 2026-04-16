import { PoolClient } from 'pg';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import * as dotenv from 'dotenv';
dotenv.config();

const SIM_URL = process.env.SIM_URL || 'http://localhost:4000';
const RISK_THRESHOLD = 0.50;
const MAX_TIMEFRAME_HOURS = 2;

// ── Types ────────────────────────────────────────────────────────────────────

interface ManualClaimInput {
  workerId: string;
  disruptionType: string;
  timeframeStart: string; // ISO timestamp
  timeframeEnd: string;   // ISO timestamp
  note: string;
  clientRequestId: string;
}

interface HourlyInterval {
  intervalStart: Date;
  intervalEnd: Date;
  overlapStart: Date;
  overlapEnd: Date;
  overlapMinutes: number;
  overlapRatio: number;
}

interface ClaimResult {
  claim: any;
  isExisting: boolean;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateInput(input: ManualClaimInput): string | null {
  if (!input.disruptionType) return 'disruptionType is required';
  if (!input.timeframeStart) return 'timeframeStart is required';
  if (!input.timeframeEnd) return 'timeframeEnd is required';
  if (!input.clientRequestId) return 'clientRequestId is required';

  const start = new Date(input.timeframeStart);
  const end = new Date(input.timeframeEnd);

  if (isNaN(start.getTime())) return 'timeframeStart is not a valid timestamp';
  if (isNaN(end.getTime())) return 'timeframeEnd is not a valid timestamp';

  if (start >= end) return 'timeframeStart must be before timeframeEnd';

  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (diffHours > MAX_TIMEFRAME_HOURS) return `Timeframe cannot exceed ${MAX_TIMEFRAME_HOURS} hours`;

  return null;
}

// ── Interval Splitting ───────────────────────────────────────────────────────

function splitIntoHourlyIntervals(start: Date, end: Date): HourlyInterval[] {
  // Floor start to hour boundary (UTC)
  const bucketStart = new Date(start);
  bucketStart.setUTCMinutes(0, 0, 0);

  // Ceil end to hour boundary (UTC)
  const bucketEnd = new Date(end);
  if (bucketEnd.getUTCMinutes() > 0 || bucketEnd.getUTCSeconds() > 0 || bucketEnd.getUTCMilliseconds() > 0) {
    bucketEnd.setUTCHours(bucketEnd.getUTCHours() + 1);
    bucketEnd.setUTCMinutes(0, 0, 0);
  }

  const intervals: HourlyInterval[] = [];
  let current = new Date(bucketStart);

  while (current < bucketEnd) {
    const intervalStart = new Date(current);
    const intervalEnd = new Date(current);
    intervalEnd.setUTCHours(intervalEnd.getUTCHours() + 1);

    // Compute overlap with user's actual timeframe
    const overlapStart = new Date(Math.max(intervalStart.getTime(), start.getTime()));
    const overlapEnd = new Date(Math.min(intervalEnd.getTime(), end.getTime()));
    const overlapMinutes = Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
    const overlapRatio = overlapMinutes / 60;

    if (overlapRatio > 0) {
      intervals.push({
        intervalStart,
        intervalEnd,
        overlapStart,
        overlapEnd,
        overlapMinutes,
        overlapRatio,
      });
    }

    current = new Date(intervalEnd);
  }

  return intervals;
}

// ── Main Service ─────────────────────────────────────────────────────────────

export async function processManualClaim(input: ManualClaimInput): Promise<ClaimResult> {
  console.log('[ManualClaim] Start processing:', { workerId: input.workerId, type: input.disruptionType });
  // 1. Validate
  const validationError = validateInput(input);
  if (validationError) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: validationError };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Idempotency check — return existing claim if duplicate
    const existingRes = await client.query(
      `SELECT id, policy_id AS "policyId", worker_id AS "workerId", payout_amount AS "payoutAmount",
              risk_score AS "riskScore", severity_multiplier AS "severityMultiplier",
              disruption_type AS "disruptionType", status, claim_type AS "claimType",
              claim_note AS "claimNote", rejection_reason AS "rejectionReason",
              claim_timeframe_start AS "timeframeStart", claim_timeframe_end AS "timeframeEnd",
              created_at AS "createdAt"
       FROM claims
       WHERE worker_id = $1 AND client_request_id = $2`,
      [input.workerId, input.clientRequestId]
    );

    if (existingRes.rows.length > 0) {
      await client.query('COMMIT');
      const existing = existingRes.rows[0];
      return {
        claim: {
          ...existing,
          payoutAmount: parseFloat(existing.payoutAmount),
          riskScore: parseFloat(existing.riskScore),
          severityMultiplier: parseFloat(existing.severityMultiplier),
        },
        isExisting: true,
      };
    }

    // 3. Verify active policy
    const policyRes = await client.query(
      `SELECT w.id as worker_id, w.platform_worker_id, w.city_id, w.zone_id,
              p.id as policy_id, p.premium_amount, p.coverage_multiplier
       FROM workers w
       JOIN policies p ON w.id = p.worker_id
       WHERE w.id = $1 AND p.status = 'ACTIVE'
       LIMIT 1`,
      [input.workerId]
    );

    if (policyRes.rows.length === 0) {
      throw { status: 400, code: 'NO_ACTIVE_POLICY', message: 'You must have an active policy to file a claim' };
    }

    const worker = policyRes.rows[0];

    // 4. Cooldown check — no duplicate manual claims within 24h
    const cooldownRes = await client.query(
      `SELECT id FROM claims
       WHERE worker_id = $1 AND claim_type = 'MANUAL' AND status = 'APPROVED'
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [input.workerId]
    );

    if (cooldownRes.rows.length > 0) {
      throw { status: 429, code: 'COOLDOWN_ACTIVE', message: 'You can only file one approved manual claim every 24 hours' };
    }

    // 5. Parse and normalize timestamps to UTC
    const tfStart = new Date(input.timeframeStart);
    const tfEnd = new Date(input.timeframeEnd);

    // 6. Split into hourly intervals
    const intervals = splitIntoHourlyIntervals(tfStart, tfEnd);
    console.log(`[ManualClaim] Processing for Worker ${input.workerId} | Zone: ${worker.zone_id} | Timeframe: ${tfStart.toISOString()} to ${tfEnd.toISOString()} | intervals: ${intervals.length}`);

    // 7. For each interval, query zone_risk_snapshots and compute weighted risk
    let totalWeightedRisk = 0;
    let totalWeight = 0;
    let hasPartialData = false;

    for (const interval of intervals) {
      console.log(`[ManualClaim] Interval Query: zone=${worker.zone_id}, start=${interval.intervalStart.toISOString()}, end=${interval.intervalEnd.toISOString()}`);
      const snapshotsRes = await client.query(
        `SELECT AVG(risk_score) as avg_risk, COUNT(*) as snapshot_count
         FROM zone_risk_snapshots
         WHERE zone_id = $1
           AND created_at >= ($2::timestamptz AT TIME ZONE 'Asia/Calcutta')
           AND created_at < ($3::timestamptz AT TIME ZONE 'Asia/Calcutta')`,
        [worker.zone_id, interval.intervalStart.toISOString(), interval.intervalEnd.toISOString()]
      );

      const row = snapshotsRes.rows[0];
      const snapshotCount = parseInt(row.snapshot_count);

      if (snapshotCount === 0) {
        // No data for this interval — treat as 0 risk
        hasPartialData = true;
        console.warn(`[ManualClaim] Interval ${interval.intervalStart.toISOString()} — NO SNAPSHOTS FOUND in DB`);
      } else {
        const avgRisk = parseFloat(row.avg_risk || '0');
        totalWeightedRisk += avgRisk * interval.overlapRatio;
        totalWeight += interval.overlapRatio;
        console.log(`[ManualClaim] Interval Result: avgRisk=${avgRisk}, count=${snapshotCount}, overlap=${interval.overlapRatio}`);
      }
    }

    // Compute final weighted risk score
    const weightedRiskScore = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0;
    console.log(`[ManualClaim] Final Weighted Risk: ${weightedRiskScore.toFixed(4)} | Threshold: ${RISK_THRESHOLD} | Partial: ${hasPartialData}`);

    // 8. Decision: approve or reject
    const claimId = uuidv4();

    if (weightedRiskScore < RISK_THRESHOLD) {
      // REJECTED — risk too low
      let rejectionReason = `Risk score ${weightedRiskScore.toFixed(2)} is below threshold ${RISK_THRESHOLD}`;
      if (hasPartialData) {
        rejectionReason += '. Partial data available for the requested timeframe.';
      }

      await client.query(
        `INSERT INTO claims (id, policy_id, worker_id, payout_amount, risk_score, severity_multiplier,
                             disruption_type, status, claim_type, claim_timeframe_start, claim_timeframe_end,
                             claim_note, rejection_reason, client_request_id)
         VALUES ($1, $2, $3, 0, $4, 1.0, $5, 'REJECTED', 'MANUAL', $6, $7, $8, $9, $10)`,
        [claimId, worker.policy_id, input.workerId, weightedRiskScore,
         input.disruptionType, tfStart.toISOString(), tfEnd.toISOString(),
         input.note, rejectionReason, input.clientRequestId]
      );

      await client.query('COMMIT');
      console.log(`[ManualClaim] REJECTED — Worker ${input.workerId} | Risk: ${weightedRiskScore.toFixed(2)}`);

      return {
        claim: {
          id: claimId,
          policyId: worker.policy_id,
          workerId: input.workerId,
          payoutAmount: 0,
          riskScore: weightedRiskScore,
          severityMultiplier: 1.0,
          disruptionType: input.disruptionType,
          status: 'REJECTED',
          claimType: 'MANUAL',
          claimNote: input.note,
          rejectionReason,
          timeframeStart: tfStart.toISOString(),
          timeframeEnd: tfEnd.toISOString(),
          createdAt: new Date().toISOString(),
        },
        isExisting: false,
      };
    }

    // 9. APPROVED — calculate payout using same logic as payoutWorker

    // Duration in hours based on actual user timeframe
    const durationHours = (tfEnd.getTime() - tfStart.getTime()) / (1000 * 60 * 60);

    // Fetch worker's historical income for the relevant hour
    const currentHour = tfStart.getHours();
    let incomeRate = 120; // Default fallback
    try {
      console.log(`[ManualClaim] Fetching income stats from: ${SIM_URL}/platform/workers/${worker.platform_worker_id}/income-stats?hour=${currentHour}`);
      const statRes = await axios.get(`${SIM_URL}/platform/workers/${worker.platform_worker_id}/income-stats?hour=${currentHour}`);
      if (statRes.status === 200) {
        const stats = statRes.data;
        incomeRate = stats.hourlyAverageIncome || 120;
      }
    } catch (e: any) {
      console.warn('[ManualClaim] Failed to fetch income stats:', e.message);
    }

    const intervalLoss = incomeRate * durationHours;
    const baseCoverage = parseFloat(worker.coverage_multiplier) * parseFloat(worker.premium_amount);
    const remainingLoss = Math.max(0, intervalLoss - baseCoverage);
    const riskAdjusted = remainingLoss * weightedRiskScore;
    const payout = baseCoverage + riskAdjusted;

    console.log(`[ManualClaim] Payout Calc — income: ₹${incomeRate}/hr | duration: ${durationHours.toFixed(2)}h | loss: ₹${intervalLoss.toFixed(2)} | payout: ₹${payout.toFixed(2)}`);

    // Insert approved claim
    await client.query(
      `INSERT INTO claims (id, policy_id, worker_id, payout_amount, risk_score, severity_multiplier,
                           disruption_type, status, claim_type, claim_timeframe_start, claim_timeframe_end,
                           claim_note, client_request_id)
       VALUES ($1, $2, $3, $4, $5, 1.0, $6, 'APPROVED', 'MANUAL', $7, $8, $9, $10)`,
      [claimId, worker.policy_id, input.workerId, payout, weightedRiskScore,
       input.disruptionType, tfStart.toISOString(), tfEnd.toISOString(),
       input.note, input.clientRequestId]
    );

    // Credit wallet
    await client.query(
      `INSERT INTO wallet_ledger (id, worker_id, amount, type, category, reference_id, idempotency_key)
       VALUES ($1, $2, $3, 'CREDIT', 'CLAIM_PAYOUT', $4, $5)`,
      [uuidv4(), input.workerId, payout, claimId, `manual-payout-${claimId}`]
    );

    // Outbox event
    await client.query(
      `INSERT INTO outbox_events (id, event_type, payload, status)
       VALUES ($1, 'MANUAL_CLAIM_APPROVED', $2, 'PENDING')`,
      [uuidv4(), JSON.stringify({
        workerId: input.workerId,
        amount: payout,
        disruptionType: input.disruptionType,
        reason: `Manual claim approved — weighted risk ${weightedRiskScore.toFixed(2)}`,
      })]
    );

    await client.query('COMMIT');
    console.log(`[ManualClaim] APPROVED — Worker ${input.workerId} | Payout: ₹${payout.toFixed(2)}`);

    return {
      claim: {
        id: claimId,
        policyId: worker.policy_id,
        workerId: input.workerId,
        payoutAmount: payout,
        riskScore: weightedRiskScore,
        severityMultiplier: 1.0,
        disruptionType: input.disruptionType,
        status: 'APPROVED',
        claimType: 'MANUAL',
        claimNote: input.note,
        rejectionReason: null,
        timeframeStart: tfStart.toISOString(),
        timeframeEnd: tfEnd.toISOString(),
        createdAt: new Date().toISOString(),
      },
      isExisting: false,
    };

  } catch (err: any) {
    await client.query('ROLLBACK');

    // Re-throw structured errors
    if (err.status) throw err;

    console.error('[ManualClaim] Service error:', err);
    throw { status: 500, code: 'INTERNAL_ERROR', message: err.message || 'Unexpected error processing claim' };
  } finally {
    client.release();
  }
}
