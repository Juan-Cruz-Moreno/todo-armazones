import { createClient } from 'redis';
import env from './env';
import logger from './logger';

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Conectado a Redis correctamente');
});

await redisClient.connect();

export default redisClient;
