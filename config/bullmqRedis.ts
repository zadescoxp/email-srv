import IORedis from 'ioredis';

// Create an IORedis connection for BullMQ
export const bullmqRedis = new IORedis(process.env.REDIS_URL as string, {
  password: process.env.REDIS_TOKEN,
  maxRetriesPerRequest: 5,
});