import Redis, { RedisOptions } from 'ioredis';
import { logger } from './logger.js';

// Redis Configuration
const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    // Only include password if explicitly set (avoid undefined with exactOptionalPropertyTypes)
    ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
    maxRetriesPerRequest: null, // Required for Socket.io adapter
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
        return delay;
    },
    lazyConnect: true,
};

/**
 * Main Redis client singleton for general caching operations
 */
export const redis = new Redis(redisConfig);

// Event listeners for connection status
redis.on('connect', () => {
    logger.info('Redis client connected');
});

redis.on('ready', () => {
    logger.info('Redis client ready');
});

redis.on('error', (error) => {
    logger.error('Redis client error:', error);
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
});

/**
 * Pub client for Socket.io Redis adapter
 * Socket.io requires separate pub/sub connections
 */
export const redisPub = new Redis(redisConfig);

redisPub.on('connect', () => {
    logger.info('Redis PUB client connected');
});

redisPub.on('error', (error) => {
    logger.error('Redis PUB client error:', error);
});

/**
 * Sub client for Socket.io Redis adapter
 * Socket.io requires separate pub/sub connections
 */
export const redisSub = new Redis(redisConfig);

redisSub.on('connect', () => {
    logger.info('Redis SUB client connected');
});

redisSub.on('error', (error) => {
    logger.error('Redis SUB client error:', error);
});

/**
 * Connect all Redis clients
 * Call this during application startup
 */
export async function connectRedis(): Promise<void> {
    try {
        await redis.connect();
        await redisPub.connect();
        await redisSub.connect();
        logger.info('All Redis clients connected successfully');
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}

/**
 * Disconnect all Redis clients
 * Call this during graceful shutdown
 */
export async function disconnectRedis(): Promise<void> {
    try {
        await redis.quit();
        await redisPub.quit();
        await redisSub.quit();
        logger.info('All Redis clients disconnected');
    } catch (error) {
        logger.error('Error disconnecting Redis clients:', error);
    }
}

/**
 * Health check for Redis connection
 */
export async function isRedisHealthy(): Promise<boolean> {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch {
        return false;
    }
}

export default redis;
