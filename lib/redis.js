import { Redis } from '@upstash/redis';

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Please define UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables');
}

class UpstashRedisClient {
  constructor() {
    if (UpstashRedisClient.instance) {
      return UpstashRedisClient.instance;
    }

    this.client = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });

    console.log('✅ Upstash Redis client initialized');
    UpstashRedisClient.instance = this;
  }

  static getInstance() {
    if (!UpstashRedisClient.instance) {
      UpstashRedisClient.instance = new UpstashRedisClient();
    }
    return UpstashRedisClient.instance;
  }

  getClient() {
    return this.client;
  }

  // Cache utilities
  async set(key, value, expireInSeconds) {
    try {
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        return await this.client.setex(key, expireInSeconds, serializedValue);
      } else {
        return await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      throw error;
    }
  }

  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  // Session management
  async setSession(sessionId, data, expireInSeconds = 3600) {
    return await this.set(`session:${sessionId}`, data, expireInSeconds);
  }

  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  async extendSession(sessionId, expireInSeconds = 3600) {
    return await this.expire(`session:${sessionId}`, expireInSeconds);
  }

  // Cart management
  async setCart(userId, cart, expireInSeconds = 86400) {
    return await this.set(`cart:${userId}`, cart, expireInSeconds);
  }

  async getCart(userId) {
    return await this.get(`cart:${userId}`);
  }

  async deleteCart(userId) {
    return await this.del(`cart:${userId}`);
  }

  async extendCart(userId, expireInSeconds = 86400) {
    return await this.expire(`cart:${userId}`, expireInSeconds);
  }

  // Product caching
  async cacheProduct(productId, product, expireInSeconds = 3600) {
    return await this.set(`product:${productId}`, product, expireInSeconds);
  }

  async getCachedProduct(productId) {
    return await this.get(`product:${productId}`);
  }

  async deleteCachedProduct(productId) {
    return await this.del(`product:${productId}`);
  }

  // Category caching
  async cacheCategories(categories, expireInSeconds = 7200) {
    return await this.set('categories:all', categories, expireInSeconds);
  }

  async getCachedCategories() {
    return await this.get('categories:all');
  }

  async deleteCachedCategories() {
    return await this.del('categories:all');
  }

  // Rate limiting
  async incrementRateLimit(key, windowInSeconds = 60, limit = 100) {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, windowInSeconds);
      }
      return {
        count: current,
        remaining: Math.max(0, limit - current),
        reset: await this.ttl(key),
        limited: current > limit,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      return {
        count: 0,
        remaining: limit,
        reset: windowInSeconds,
        limited: false,
      };
    }
  }

  // Health check
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }
}

export const redis = UpstashRedisClient.getInstance();
export default redis;