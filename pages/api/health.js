import connectDB from '../../lib/mongodb.js';
import { redis } from '../../lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Test MongoDB connection
    await connectDB();
    health.services.mongodb = 'connected';
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    health.services.mongodb = 'disconnected';
    health.status = 'degraded';
  }

  try {
    // Test Redis connection
    const pingResult = await redis.ping();
    health.services.redis = pingResult ? 'connected' : 'disconnected';
    if (!pingResult) {
      health.status = 'degraded';
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;

  res.status(statusCode).json({
    success: health.status === 'ok',
    data: health,
  });
}