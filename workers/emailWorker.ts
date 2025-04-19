import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../config/redis';
import { Resend } from 'resend';
import { renderTemplate } from '../utils/renderTemplate';

console.log('📬 Email Worker: Initializing with Upstash Redis connection');
console.log('🔑 Email Worker: Checking for Resend API key:', process.env.RESEND_API_KEY ? 'Key is set' : 'Key is missing!');

const resend = new Resend(process.env.RESEND_API_KEY || '');

const subjectMap: Record<string, string> = {
  onboarding: 'Welcome to Our Service!',
  invoice: 'Your Invoice Details',
  receipt: 'Payment Receipt',
};

console.log('👷 Email Worker: Creating worker instance for queue: emailQueue');

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    
    try {
      const { to, type, data } = job.data;

      const html = await renderTemplate(type, data);

      const subject = subjectMap[type] || 'Notification';

      const result = await resend.emails.send({
        from: '<suarhokya123@gmail.com>', 
        to,
        subject,
        html,
      });

      if (result.error) {
        console.error(`❌ Email Worker: Failed to send email: ${result.error.message}`);
        throw new Error(`Failed to send email: ${result.error.message}`);
      }

      console.log(`✅ Email Worker: Email of type '${type}' sent to ${to} successfully`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ Email Worker: Error processing job:', error);
      throw error; 
    }
  },
  { 
    connection: bullmqConnection,
    concurrency: 5,
  }
);
