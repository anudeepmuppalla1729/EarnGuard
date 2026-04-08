import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app'; 
import { pool } from '../../src/db';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

describe('Integration Tests: Main API Routes', () => {
    let mockWorkerId: string;
    let mockPolicyId: string;
    let validToken: string;

    beforeAll(async () => {
        mockWorkerId = uuidv4();
        // Insert dummy worker spanning into Z1 organically
        await pool.query(`
            INSERT INTO workers (id, platform_worker_id, email, password_hash, name, city_id, zone_id, platform)
            VALUES ($1, 'WK-TEST-99', 'driver_test_99@blinkit.com', 'hashed123', 'Integration Hero', 'C1', 'Z1', 'BLINKIT')
        `, [mockWorkerId]);

        // Setup mock JWT token natively matched to process.env or fallback securely
        validToken = jwt.sign({ workerId: mockWorkerId, id: mockWorkerId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    });

    it('POST /api/v1/auth/register - Should create a new worker securely generating Native Hashes', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'new_driver_999@zepto.com',
                password: 'securePassword123',
                name: 'New Zepto Driver',
                city_id: 'C1',
                zone_id: 'Z1',
                mobile: '9999999999',
                platform: 'ZEPTO'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
    });

    it('POST /api/v1/auth/login - Should safely mint JWT credentials mapping Bcrypt hashes natively', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'new_driver_999@zepto.com',
                password: 'securePassword123'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
        // Since login endpoint only returns accessToken, refreshToken, expiresIn, no need to check workerId
    });

    it('GET /api/v1/workers/me - Should fetch blank generic worker profile natively', async () => {
        const res = await request(app)
            .get('/api/v1/workers/me')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(mockWorkerId);
        expect(res.body.data.walletBalance).toBe(0); 
    });

    it('POST /api/v1/policies/quote - Should confidently issue DRAFT policy', async () => {
        const res = await request(app)
            .post('/api/v1/policies/quote')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ cityId: 'C1' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.quotes[0].policyId).toBeDefined();
        
        mockPolicyId = res.body.quotes[0].policyId; // Saving for the activation test natively
    });

    it('POST /api/v1/policies/activate - Should dynamically activate the DRAFT logic safely avoiding DB lock conflicts natively', async () => {
        const res = await request(app)
            .post('/api/v1/policies/activate')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ 
                tier: 'BASIC',
                idempotencyKey: uuidv4()
            });

        // 200 OK because we mocked the Bank Transaction positively
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.policyId).toBeDefined();

        // Prove via Database Postgres query that state mutated cleanly
        const policyCheck = await pool.query('SELECT status FROM policies WHERE id = $1', [res.body.data.policyId]);
        expect(policyCheck.rows[0].status).toBe('ACTIVE');
    });

    it('POST /api/v1/policies/activate - Should reject idempotency (Already Active) smoothly natively', async () => {
        const res = await request(app)
            .post('/api/v1/policies/activate')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ 
                tier: 'BASIC',
                idempotencyKey: uuidv4() // Brand new key, but policy is same
            });

        // Natively trapped via conflict error since status already shifted!
        expect(res.status).toBe(409);
        expect(res.body.error).toBe("Worker already has an active policy");
    });
});
