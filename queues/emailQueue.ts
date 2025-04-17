import { Queue } from "bullmq";
import { bullmqRedis } from "../config/bullmqRedis";

export const emailQueue = new Queue("emailQueue", {
    connection: bullmqRedis,
});