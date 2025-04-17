// server.ts
import express from 'express';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { emailQueue } from './queues/emailQueue';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

interface EmailRequest {
  to: string;
  type: string;
  data: Record<string, any>;
}

// Fixed route handler to conform to Express 5 typing requirements
app.route('/enqueue-email').post(async (req: Request<{}, {}, EmailRequest>, res: Response) => {
  const { to, type, data } = req.body;

  if (!to || !type || !data) {
    res.status(400).json({ error: 'Missing required fields: to, type, or data.' });
    return;
  }

  try {
    const job = await emailQueue.add('sendEmail', { to, type, data });
    res.status(200).json({ message: 'Email job enqueued successfully.', jobId: job.id });
  } catch (error) {
    console.error('Error enqueuing email job:', error);
    res.status(500).json({ error: 'Failed to enqueue email job.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
