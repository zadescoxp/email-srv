import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.REDIS_URL?.startsWith('https://') 
    ? process.env.REDIS_URL 
    : `https://${process.env.REDIS_HOST}`,
  token: process.env.REDIS_TOKEN as string,
})

export const bullmqConnection = {
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_TOKEN,
  tls: {}
};