import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export const validate = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();  
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors || 'Validation Failed',
          requestId: req.headers['x-request-id'] || 'unknown',
        }
      });
    }
  };
};
