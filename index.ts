import express from 'express';
import bodyParser from 'body-parser';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const connection = new IORedis();
const emailQueue = new Queue('emailQueue', { connection });

app.post('/enqueue-email', async (req, res) => {
  const { to, type, data } = req.body;

  if (!to || !type || !data) {
    return res.status(400).json({ error: 'Missing required fields: to, type, or data.' });
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