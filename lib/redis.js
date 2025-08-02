import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    this.client = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    this.isConnected = false;

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('❌ Disconnected from Redis');
      this.isConnected = false;
    });

    RedisClient.instance = this;
  }

  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  getClient() {
    return this.client;
  }

  // Cache utilities
  async set(key, value, expireInSeconds) {
    await this.connect();
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get(key) {
    await this.connect();
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key) {
    await this.connect();
    await this.client.del(key);
  }

  async exists(key) {
    await this.connect();
    return (await this.client.exists(key)) === 1;
  }

  // Session management
  async setSession(sessionId, data, expireInSeconds = 3600) {
    await this.set(`session:${sessionId}`, data, expireInSeconds);
  }

  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    await this.del(`session:${sessionId}`);
  }

  // Cart management
  async setCart(userId, cart, expireInSeconds = 86400) {
    await this.set(`cart:${userId}`, cart, expireInSeconds);
  }

  async getCart(userId) {
    return await this.get(`cart:${userId}`);
  }

  async deleteCart(userId) {
    await this.del(`cart:${userId}`);
  }
}

export const redis = RedisClient.getInstance();
export default redis;