import { Worker } from 'bullmq';
import { bullmqRedis } from '../config/bullmqRedis';
import { Resend } from 'resend';
import { renderTemplate } from '../utils/renderTemplate';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const subjectMap: Record<string, string> = {
  onboarding: 'Welcome to Our Service!',
  invoice: 'Your Invoice Details',
  receipt: 'Payment Receipt',
};

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { to, type, data } = job.data;

    const html = await renderTemplate(type, data);

    const subject = subjectMap[type] || 'Notification';

    const { error } = await resend.emails.send({
      from: '<suarhokya123@gmail.com>', 
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`Email of type '${type}' sent to ${to}`);
  },
  { connection: bullmqRedis }
);
