import { Channel } from "amqplib";
import { getChannel, QUEUE_NAME } from "../config/rabbitmq.js";

console.log("📬 Email Queue: Initializing queue with RabbitMQ");

// Interface for email job data
export interface EmailJob {
  to: string;
  type: string;
  data: Record<string, any>;
  attempts?: number;
  jobId?: string;
}

// Function to add a job to the queue
export async function addEmailToQueue(jobData: EmailJob): Promise<string> {
  try {
    const channel = await getChannel();

    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Add job metadata
    const job = {
      ...jobData,
      jobId,
      attempts: 0,
      timestamp: Date.now(),
    };

    // Publish message to queue with persistent delivery mode
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
      persistent: true,
      messageId: jobId,
    });

    console.log(
      `✅ Email Queue: Email job successfully added with ID: ${jobId}`
    );
    return jobId;
  } catch (error) {
    console.error(`❌ Email Queue: Error adding job to queue`, error);
    throw error;
  }
}
