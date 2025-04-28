// filepath: z:\Paycrypt\email-srv\config\rabbitmq.ts
import amqplib, { Channel, Connection } from "amqplib";

// Connection variables
let connection: Connection | null = null;
let channel: Channel | null = null;

// Queue name
export const QUEUE_NAME = "emailQueue";

// Connect to RabbitMQ
export async function connectRabbitMQ(): Promise<{
  connection: Connection;
  channel: Channel;
}> {
  try {
    if (connection && channel) {
      return { connection, channel };
    }

    const rabbitMQUrl = process.env.RABBITMQ_URL || "amqp://localhost";
    console.log(`🐰 RabbitMQ: Connecting to ${rabbitMQUrl}`);

    connection = await amqplib.connect(rabbitMQUrl);
    console.log("✅ RabbitMQ: Connection established");

    channel = await connection.createChannel();
    console.log(`📬 RabbitMQ: Channel created`);

    // Ensure the queue exists with durability for message persistence
    await channel.assertQueue(QUEUE_NAME, {
      durable: true, // Keep the queue alive even if the server restarts
    });
    console.log(`🔧 RabbitMQ: Queue "${QUEUE_NAME}" asserted`);

    // Handle connection errors
    connection.on("error", (err) => {
      console.error("❌ RabbitMQ: Connection error", err);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.log("⚠️ RabbitMQ: Connection closed");
      connection = null;
      channel = null;
    });

    return { connection, channel };
  } catch (error) {
    console.error("❌ RabbitMQ: Failed to connect", error);
    throw error;
  }
}

// Function to get the channel (creates connection if needed)
export async function getChannel(): Promise<Channel> {
  if (!channel) {
    const result = await connectRabbitMQ();
    return result.channel;
  }
  return channel;
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
  console.log("👋 RabbitMQ: Connection closed gracefully");
}
