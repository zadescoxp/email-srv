import "dotenv/config";
import { Channel, ConsumeMessage } from "amqplib";
import { connectRabbitMQ, QUEUE_NAME } from "../config/rabbitmq.js";
import { Resend } from "resend";
import { renderTemplate } from "../utils/renderTemplate.js";
import { EmailJob } from "../queues/emailQueue.js";

console.log("📬 Email Worker: Initializing with RabbitMQ connection");
console.log(
  "🔑 Email Worker: Checking for Resend API key:",
  process.env.RESEND_API_KEY ? "Key is set" : "Key is missing!"
);

const resend = new Resend(process.env.RESEND_API_KEY || "");

const subjectMap: Record<string, string> = {
  onboarding: "Welcome to Our Service!",
  invoice: "Your Invoice Details",
  receipt: "Payment Receipt",
};

// Maximum number of retries
const MAX_RETRIES = 3;

// Process a message from the queue
async function processMessage(msg: ConsumeMessage, channel: Channel) {
  if (!msg.content) {
    console.warn("⚠️ Email Worker: Empty message received");
    channel.ack(msg);
    return;
  }

  let job: EmailJob;

  try {
    // Parse job data
    job = JSON.parse(msg.content.toString()) as EmailJob;
    console.log(`🔄 Email Worker: Processing job ${job.jobId}`);

    const { to, type, data, attempts = 0 } = job;

    // Render email template
    const html = await renderTemplate(type, data);

    // Determine email subject
    const subject = subjectMap[type] || "Notification";

    // Send email via Resend
    const result = await resend.emails.send({
      from: "Paycrypt <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log(
      `✅ Email Worker: Email of type '${type}' sent to ${to} successfully`
    );

    // Acknowledge the message as processed
    channel.ack(msg);
  } catch (error: any) {
    const errorMessage = error?.message || "Unknown error";
    console.error(`❌ Email Worker: Error processing job: ${errorMessage}`);

    // Get current attempt count
    const job = JSON.parse(msg.content.toString()) as EmailJob;
    const attempts = (job.attempts || 0) + 1;

    if (attempts <= MAX_RETRIES) {
      // Update attempt count and requeue
      const updatedJob = { ...job, attempts };
      console.log(
        `🔄 Email Worker: Retrying job (attempt ${attempts}/${MAX_RETRIES})`
      );

      // Negative acknowledge and requeue
      channel.nack(msg, false, false);

      // Republish with updated attempt count after a delay
      setTimeout(() => {
        channel.sendToQueue(
          QUEUE_NAME,
          Buffer.from(JSON.stringify(updatedJob)),
          {
            persistent: true,
            messageId: job.jobId,
          }
        );
      }, attempts * 1000); // Exponential backoff: 1s, 2s, 3s
    } else {
      console.error(
        `❌ Email Worker: Job failed after ${MAX_RETRIES} attempts`
      );
      // Acknowledge to remove from queue after max retries
      channel.ack(msg);

      // In a production system, you might want to send this to a dead-letter queue
    }
  }
}

// Start the worker
async function startWorker() {
  try {
    // Connect to RabbitMQ
    const { channel } = await connectRabbitMQ();

    // Set prefetch to control concurrency
    channel.prefetch(5);

    console.log(
      `👷 Email Worker: Starting to consume from queue: ${QUEUE_NAME}`
    );

    // Start consuming messages
    channel.consume(QUEUE_NAME, (msg) => {
      if (msg) {
        processMessage(msg, channel).catch((error) => {
          console.error(
            "❌ Email Worker: Unhandled error in message processing:",
            error
          );
          if (msg) {
            channel.nack(msg, false, true);
          }
        });
      }
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      console.log("👋 Email Worker: Shutting down gracefully");
      try {
        await channel.close();
        process.exit(0);
      } catch (err) {
        console.error("❌ Email Worker: Error during shutdown", err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Email Worker: Failed to start worker", error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
