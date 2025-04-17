import IORedis from 'ioredis';

export const bullmqRedis = new IORedis(process.env.REDIS_URL as string, {
  password: process.env.REDIS_TOKEN,
  maxRetriesPerRequest: 5,
});