import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the general .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Determine the environment and load the corresponding .env file
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  USER_AGENT: process.env.USER_AGENT || 'todoarmazonesarg-backend/1.0 (Contact: contacto@todoarmazonesarg.com)',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default_session_secret',
  RESET_PASSWORD_SECRET: process.env.RESET_PASSWORD_SECRET || 'default_reset_password_secret',
  DOLLAR_API_URL_1: process.env.DOLLAR_API_URL_1 || 'https://api.bluelytics.com.ar/v2/latest',
  DOLLAR_API_URL_2: process.env.DOLLAR_API_URL_2 || 'https://dolarapi.com/v1/dolares/blue',

  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.example.com',
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER || 'your_email@example.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'your_email_password',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:4000',
};

export default env;
