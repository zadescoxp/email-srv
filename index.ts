import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import { addEmailToQueue, EmailJob } from "./queues/emailQueue";
import { connectRabbitMQ, closeConnection } from "./config/rabbitmq";

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`🔄 Server: Initializing Express app on port ${PORT}`);

app.use(bodyParser.json());

interface EmailRequest {
  to: string;
  type: string;
  data: Record<string, any>;
}

// Initialize RabbitMQ connection
connectRabbitMQ()
  .then(() => {
    console.log("✅ Server: RabbitMQ connection established");
  })
  .catch((error) => {
    console.error("❌ Server: Failed to connect to RabbitMQ:", error);
  });

app
  .route("/enqueue-email")
  .post(async (req: Request<{}, {}, EmailRequest>, res: Response) => {
    console.log("📨 Server: Received request to /enqueue-email");

    const { to, type, data } = req.body;

    if (!to || !type || !data) {
      console.warn("⚠️ Server: Request missing required fields", {
        to: !!to,
        type: !!type,
        data: !!data,
      });
      res
        .status(400)
        .json({ error: "Missing required fields: to, type, or data." });
      return;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("RabbitMQ operation timed out after 15000ms")),
          15000
        );
      });

      const queuePromise = addEmailToQueue({ to, type, data });

      const jobId = (await Promise.race([
        queuePromise,
        timeoutPromise,
      ])) as string;

      console.log(`✅ Server: Email job successfully added with ID: ${jobId}`);
      res
        .status(200)
        .json({ message: "Email job enqueued successfully.", jobId });
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error(`❌ Server: Error enqueuing email job: ${errorMessage}`);

      if (
        errorMessage.includes("timed out") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("connect")
      ) {
        res.status(503).json({
          error:
            "RabbitMQ connection issue. The email service is temporarily unavailable.",
          details: errorMessage,
        });
      } else {
        res.status(500).json({
          error: "Failed to enqueue email job.",
          details: errorMessage,
        });
      }
    }
  });

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log("🔍 Make sure the email worker is running");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("👋 Server: Shutting down gracefully");
  server.close();
  await closeConnection();
  process.exit(0);
});
