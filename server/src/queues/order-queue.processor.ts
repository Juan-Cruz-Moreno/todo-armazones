import { Worker, Job } from 'bullmq';
import { generateOrderPDF } from '@utils/pdfGenerator';
import { sendOrderConfirmationEmail } from '@utils/sendOrderConfirmationEmail';
import { OrderResponseDto } from '@dto/order.dto';
import env from '@config/env';

const connection = {
  url: env.REDIS_URL,
};

export const orderWorker = new Worker(
  'orderQueue',
  async (job: Job) => {
    const { order } = job.data as { order: OrderResponseDto };
    const pdfBuffer = await generateOrderPDF(order);
    await sendOrderConfirmationEmail({
      to: order.user.email,
      order,
      pdfBuffer,
    });
  },
  { connection },
);
