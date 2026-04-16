import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AdminJwtPayload {
    role: string;
}

export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.ADMIN_JWT_SECRET || 'fallback-admin-secret-for-dev';
        
        const decoded = jwt.verify(token, secret) as AdminJwtPayload;
        
        if (decoded.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Forbidden: Requires ADMIN role' });
            return;
        }

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Unauthorized: Invalid admin token' });
        return;
    }
};
