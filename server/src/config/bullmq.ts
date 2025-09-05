import { Queue } from 'bullmq';
import env from './env';

const connection = {
  url: env.REDIS_URL,
};

export const orderQueue = new Queue('orderQueue', { connection });

export default orderQueue;
