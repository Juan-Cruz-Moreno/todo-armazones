import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import env from './env';

// Determinar el entorno
const isProduction = env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || 'info';

// Formato común de logs para archivos
const fileLogFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.prettyPrint(),
);

// Transport para logs de información
const infoTransport = new DailyRotateFile({
  filename: path.join('logs', 'info', 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: fileLogFormat,
});

// Transport para logs de errores
const errorTransport = new DailyRotateFile({
  filename: path.join('logs', 'error', 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: fileLogFormat,
});

// Crear el logger
const logger = createLogger({
  level: logLevel,
  transports: [infoTransport, errorTransport],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs', 'exceptions', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileLogFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs', 'rejections', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileLogFormat,
    }),
  ],
  exitOnError: false,
});

// Agrega consola solo en desarrollo
if (!isProduction) {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        }),
      ),
    }),
  );
}

export default logger;
