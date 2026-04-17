import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redisConfig = {
  host: process.env.REDIS_HOST?.trim() || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  username: process.env.REDIS_USERNAME?.trim() || 'default',
  password: process.env.REDIS_PASSWORD?.trim() || undefined,
  maxRetriesPerRequest: null,
  skipVersionCheck: true,
};
