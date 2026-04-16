import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as adminService from '../services/adminService';

const wrap = (data: any) => ({ data, timestamp: new Date().toISOString() });
const handler = (fn: (req: Request) => Promise<any>) => async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(wrap(await fn(req))); } catch (e) { next(e); }
};

export const login = (req: Request, res: Response) => {
    const { username, password } = req.body;
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === validUser && password === validPass) {
        const secret = process.env.ADMIN_JWT_SECRET || 'fallback-admin-secret-for-dev';
        const token = jwt.sign({ role: 'ADMIN' }, secret, { expiresIn: '12h' });
        res.json(wrap({ token }));
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
};

export const getHealth = handler(async () => adminService.getHealth());
export const getMetrics = handler(async () => adminService.getMetrics());
export const getRiskOverview = handler(async () => adminService.getRiskOverview());
export const getActiveDisruptions = handler(async () => adminService.getActiveDisruptions());
export const getClaimPipelineStats = handler(async () => adminService.getClaimPipelineStats());
export const getClaimsSummary = handler(async () => adminService.getClaimsSummary());
export const getClaimsDetail = handler(async (req) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    return adminService.getClaimsDetail({
        zoneId: req.query.zoneId as string,
        status: req.query.status as string,
        source: req.query.source as string,
        page, limit,
    });
});
export const getFraudInsights = handler(async () => adminService.getFraudMetrics());
export const getPayoutStats = handler(async () => adminService.getPayoutStats());
export const getQueueStats = handler(async () => adminService.getQueueStats());
export const getMlMetrics = handler(async () => adminService.getMlMetrics());
export const getPricing = handler(async () => adminService.getPricing());
export const getSignals = handler(async (req) => adminService.getSignals(req.query.zoneId as string || 'Z1'));

export const getSystemConfig = handler(async () => adminService.getSystemConfig());
export const updateSystemConfig = handler(async (req) => adminService.updateSystemConfig(req.body.key, req.body.value));
export const downloadReport = async (req: Request, res: Response) => {
    try {
        const csv = await adminService.generateOperationalReport();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=earnguard_operational_report.csv');
        res.send(csv);
    } catch (e) {
        res.status(500).json({ error: 'Report generation failed' });
    }
};
export const getUsers = handler(async (req) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    return adminService.getUsers(page, limit);
});

export const simulateWeather = handler(async (req) => adminService.simulateSignal('weather', req.body));
export const simulatePlatform = handler(async (req) => adminService.simulateSignal('platform', req.body));
export const simulateNews = handler(async (req) => adminService.simulateSignal('news', req.body));
export const simulateTraffic = handler(async (req) => adminService.simulateSignal('traffic', req.body));
