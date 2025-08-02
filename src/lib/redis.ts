import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

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
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  // Cache utilities
  public async set(key: string, value: any, expireInSeconds?: number): Promise<void> {
    await this.connect();
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    await this.connect();
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  public async del(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    await this.connect();
    return (await this.client.exists(key)) === 1;
  }

  // Session management
  public async setSession(sessionId: string, data: any, expireInSeconds: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, data, expireInSeconds);
  }

  public async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.get<T>(`session:${sessionId}`);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Cart management
  public async setCart(userId: string, cart: any, expireInSeconds: number = 86400): Promise<void> {
    await this.set(`cart:${userId}`, cart, expireInSeconds);
  }

  public async getCart<T>(userId: string): Promise<T | null> {
    return await this.get<T>(`cart:${userId}`);
  }

  public async deleteCart(userId: string): Promise<void> {
    await this.del(`cart:${userId}`);
  }
}

export const redis = RedisClient.getInstance();
export default redis;