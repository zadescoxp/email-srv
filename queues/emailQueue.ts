import { Queue } from "bullmq";
import { bullmqConnection } from "../config/redis";

console.log('📬 Email Queue: Initializing queue with Upstash Redis connection');

export const emailQueue = new Queue("emailQueue", {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 200
    }
});

