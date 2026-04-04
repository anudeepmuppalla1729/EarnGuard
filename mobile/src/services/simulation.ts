// =============================================================
// Simulation Engine — Mimics real disruption worker pipeline
// Fires after auth to simulate backend-driven events
// =============================================================
import { useWalletStore } from '../store/walletStore';
import { useClaimsStore } from '../store/claimsStore';
import { useNotificationStore } from '../store/notificationStore';
import type { Claim, AppNotification } from '../types';

let timers: ReturnType<typeof setTimeout>[] = [];
let periodicTimer: ReturnType<typeof setInterval> | null = null;

const DISRUPTION_TYPES = ['HEAVY_RAIN', 'SYSTEM_TRIGGER', 'SOCIAL_DISRUPTION', 'TRAFFIC_CONGESTION', 'PLATFORM_OUTAGE'];

function randomDisruption() {
  return DISRUPTION_TYPES[Math.floor(Math.random() * DISRUPTION_TYPES.length)];
}

/**
 * Start simulation after user authenticates.
 * Mimics the real BullMQ disruption worker pipeline.
 */
export function startSimulation() {
  stopSimulation(); // clear any previous

  // ── Event 1: Auto-create claim after 15s ──────────────────
  timers.push(
    setTimeout(() => {
      const claimsStore = useClaimsStore.getState();
      const newClaim: Claim = {
        id: `clm-sim-${Date.now()}`,
        policyId: 'pol-1a2b3c4d-5e6f-7890-abcd-ef1234567890',
        workerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        payoutAmount: 65.00,
        riskScore: 0.78,
        severityMultiplier: 1.3,
        disruptionType: randomDisruption(),
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
      };
      claimsStore.addClaim(newClaim);
    }, 15_000)
  );

  // ── Event 2: Credit wallet after 25s ──────────────────────
  timers.push(
    setTimeout(() => {
      const walletStore = useWalletStore.getState();
      walletStore.creditAmount(65.00, {
        id: `clm-sim-${Date.now() - 10000}`,
        type: 'CLAIM_PAYOUT',
      });
    }, 25_000)
  );

  // ── Event 3: Notification for claim credit after 30s ──────
  timers.push(
    setTimeout(() => {
      const notifStore = useNotificationStore.getState();
      const notification: AppNotification = {
        id: `ntf-sim-${Date.now()}`,
        title: 'Claim Credited',
        message: '₹65.00 has been added to your wallet for disruption coverage.',
        type: 'CLAIM',
        read: false,
        createdAt: new Date().toISOString(),
      };
      notifStore.addNotification(notification);
    }, 30_000)
  );

  // ── Event 4: Risk alert notification after 45s ────────────
  timers.push(
    setTimeout(() => {
      const notifStore = useNotificationStore.getState();
      const alert: AppNotification = {
        id: `ntf-alert-${Date.now()}`,
        title: 'Weather Advisory',
        message: 'Heavy rain expected in Zone Z1 during 3-5 PM. Your protection is active.',
        type: 'SYSTEM',
        read: false,
        createdAt: new Date().toISOString(),
      };
      notifStore.addNotification(alert);
    }, 45_000)
  );

  // ── Periodic: Small earnings fluctuation every 60s ────────
  periodicTimer = setInterval(() => {
    const walletStore = useWalletStore.getState();
    const microEarning = parseFloat((Math.random() * 5 + 1).toFixed(2));
    walletStore.creditAmount(microEarning, {
      id: `clm-micro-${Date.now()}`,
      type: 'CLAIM_PAYOUT',
    });
  }, 60_000);
}

/**
 * Stop all simulation timers
 */
export function stopSimulation() {
  timers.forEach(t => clearTimeout(t));
  timers = [];
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
}
